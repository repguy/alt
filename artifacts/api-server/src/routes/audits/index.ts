import { Router } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { auditsTable, auditIssuesTable } from "@workspace/db";
import { requireAuth, getCurrentWorkspace } from "../../lib/auth";
import { runAuditWithAI } from "../../lib/ai";

const router = Router();

function formatAudit(a: any) {
  return {
    id: a.id,
    workspaceId: a.workspaceId,
    url: a.url,
    websiteName: a.websiteName,
    status: a.status,
    overallScore: a.overallScore,
    seoScore: a.seoScore,
    performanceScore: a.performanceScore,
    accessibilityScore: a.accessibilityScore,
    uxScore: a.uxScore,
    screenshotUrl: a.screenshotUrl,
    issueCount: a.issueCount || 0,
    createdAt: a.createdAt.toISOString(),
    completedAt: a.completedAt ? a.completedAt.toISOString() : null,
  };
}

router.get("/audits", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.status(404).json({ error: "No workspace" }); return; }

  const { status, limit = "20", offset = "0" } = req.query as Record<string, string>;

  const audits = await db
    .select({
      id: auditsTable.id,
      workspaceId: auditsTable.workspaceId,
      url: auditsTable.url,
      websiteName: auditsTable.websiteName,
      status: auditsTable.status,
      overallScore: auditsTable.overallScore,
      seoScore: auditsTable.seoScore,
      performanceScore: auditsTable.performanceScore,
      accessibilityScore: auditsTable.accessibilityScore,
      uxScore: auditsTable.uxScore,
      screenshotUrl: auditsTable.screenshotUrl,
      createdAt: auditsTable.createdAt,
      completedAt: auditsTable.completedAt,
      issueCount: sql<number>`(select count(*) from audit_issues where audit_id = ${auditsTable.id})::int`,
    })
    .from(auditsTable)
    .where(
      status
        ? and(eq(auditsTable.workspaceId, workspace.id), eq(auditsTable.status, status))
        : eq(auditsTable.workspaceId, workspace.id)
    )
    .orderBy(desc(auditsTable.createdAt))
    .limit(parseInt(limit))
    .offset(parseInt(offset));

  res.json(audits.map(formatAudit));
});

router.post("/audits", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.status(404).json({ error: "No workspace" }); return; }

  const { url, tone = "professional", reportStyle = "detailed" } = req.body;
  if (!url) { res.status(400).json({ error: "URL required" }); return; }

  let websiteName: string | null = null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    websiteName = u.hostname.replace(/^www\./, "");
  } catch {}

  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  const [audit] = await db
    .insert(auditsTable)
    .values({
      workspaceId: workspace.id,
      url: normalizedUrl,
      websiteName,
      status: "running",
      tone,
      reportStyle,
    })
    .returning();

  // Run real AI audit asynchronously
  (async () => {
    try {
      const result = await runAuditWithAI(normalizedUrl, websiteName);

      await db
        .update(auditsTable)
        .set({
          overallScore: result.overallScore,
          seoScore: result.seoScore,
          performanceScore: result.performanceScore,
          accessibilityScore: result.accessibilityScore,
          uxScore: result.uxScore,
          conversionScore: result.conversionScore,
          mobileScore: result.mobileScore,
          status: "completed",
          aiSummary: result.aiSummary,
          aiRecommendations: result.aiRecommendations,
          completedAt: new Date(),
        })
        .where(eq(auditsTable.id, audit.id));

      for (const issue of result.issues) {
        await db.insert(auditIssuesTable).values({
          auditId: audit.id,
          category: issue.category,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          recommendation: issue.recommendation,
          impact: issue.impact,
        });
      }
    } catch (err) {
      console.error("AI audit failed:", err);
      await db
        .update(auditsTable)
        .set({ status: "failed" })
        .where(eq(auditsTable.id, audit.id));
    }
  })();

  res.status(201).json({ ...formatAudit(audit), issueCount: 0 });
});

router.get("/audits/stats", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.status(200).json({ total: 0, completed: 0, inProgress: 0, failed: 0, avgScore: 0, thisMonth: 0, scoreDistribution: [] }); return; }

  const audits = await db.select().from(auditsTable).where(eq(auditsTable.workspaceId, workspace.id));
  const completed = audits.filter(a => a.status === "completed");
  const scores = completed.filter(a => a.overallScore !== null).map(a => a.overallScore as number);
  const avgScore = scores.length ? scores.reduce((s, n) => s + n, 0) / scores.length : 0;

  const now = new Date();
  const thisMonth = audits.filter(a => {
    const d = new Date(a.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const ranges = ["0-20", "21-40", "41-60", "61-80", "81-100"];
  const scoreDistribution = ranges.map(range => {
    const [min, max] = range.split("-").map(Number);
    return { range, count: scores.filter(s => s >= min && s <= max).length };
  });

  res.json({
    total: audits.length,
    completed: completed.length,
    inProgress: audits.filter(a => a.status === "running").length,
    failed: audits.filter(a => a.status === "failed").length,
    avgScore: Math.round(avgScore * 10) / 10,
    thisMonth,
    scoreDistribution,
  });
});

router.get("/audits/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const audit = await db.select().from(auditsTable).where(eq(auditsTable.id, id)).then(r => r[0]);
  if (!audit) { res.status(404).json({ error: "Not found" }); return; }

  const issues = await db.select().from(auditIssuesTable).where(eq(auditIssuesTable.auditId, id));

  res.json({
    id: audit.id,
    workspaceId: audit.workspaceId,
    url: audit.url,
    websiteName: audit.websiteName,
    status: audit.status,
    overallScore: audit.overallScore,
    seoScore: audit.seoScore,
    performanceScore: audit.performanceScore,
    accessibilityScore: audit.accessibilityScore,
    uxScore: audit.uxScore,
    conversionScore: audit.conversionScore,
    mobileScore: audit.mobileScore,
    screenshotUrl: audit.screenshotUrl,
    aiSummary: audit.aiSummary,
    aiRecommendations: audit.aiRecommendations,
    issues: issues.map(i => ({
      id: i.id,
      auditId: i.auditId,
      category: i.category,
      severity: i.severity,
      title: i.title,
      description: i.description,
      recommendation: i.recommendation,
      impact: i.impact,
    })),
    issueCount: issues.length,
    createdAt: audit.createdAt.toISOString(),
    completedAt: audit.completedAt ? audit.completedAt.toISOString() : null,
  });
});

router.delete("/audits/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(auditIssuesTable).where(eq(auditIssuesTable.auditId, id));
  await db.delete(auditsTable).where(eq(auditsTable.id, id));
  res.sendStatus(204);
});

router.post("/audits/:id/regenerate", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const audit = await db.select().from(auditsTable).where(eq(auditsTable.id, id)).then(r => r[0]);
  if (!audit) { res.status(404).json({ error: "Not found" }); return; }

  // Mark as running
  await db.update(auditsTable).set({ status: "running" }).where(eq(auditsTable.id, id));

  // Regenerate with AI async
  (async () => {
    try {
      const result = await runAuditWithAI(audit.url, audit.websiteName);
      await db.delete(auditIssuesTable).where(eq(auditIssuesTable.auditId, id));
      await db
        .update(auditsTable)
        .set({
          overallScore: result.overallScore,
          seoScore: result.seoScore,
          performanceScore: result.performanceScore,
          accessibilityScore: result.accessibilityScore,
          uxScore: result.uxScore,
          conversionScore: result.conversionScore,
          mobileScore: result.mobileScore,
          status: "completed",
          aiSummary: result.aiSummary,
          aiRecommendations: result.aiRecommendations,
          completedAt: new Date(),
        })
        .where(eq(auditsTable.id, id));
      for (const issue of result.issues) {
        await db.insert(auditIssuesTable).values({ auditId: id, ...issue });
      }
    } catch (err) {
      console.error("Regenerate audit failed:", err);
      await db.update(auditsTable).set({ status: "failed" }).where(eq(auditsTable.id, id));
    }
  })();

  const issues = await db.select().from(auditIssuesTable).where(eq(auditIssuesTable.auditId, id));
  res.json({
    id: audit.id,
    workspaceId: audit.workspaceId,
    url: audit.url,
    websiteName: audit.websiteName,
    status: "running",
    overallScore: audit.overallScore,
    seoScore: audit.seoScore,
    performanceScore: audit.performanceScore,
    accessibilityScore: audit.accessibilityScore,
    uxScore: audit.uxScore,
    conversionScore: audit.conversionScore,
    mobileScore: audit.mobileScore,
    screenshotUrl: audit.screenshotUrl,
    aiSummary: audit.aiSummary,
    aiRecommendations: audit.aiRecommendations,
    issues: issues.map(i => ({ id: i.id, auditId: i.auditId, category: i.category, severity: i.severity, title: i.title, description: i.description, recommendation: i.recommendation, impact: i.impact })),
    issueCount: issues.length,
    createdAt: audit.createdAt.toISOString(),
    completedAt: audit.completedAt ? audit.completedAt.toISOString() : null,
  });
});

export default router;
