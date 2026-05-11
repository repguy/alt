import { Router } from "express";
import { eq, and, desc, sql, avg } from "drizzle-orm";
import { db } from "@workspace/db";
import { auditsTable, auditIssuesTable } from "@workspace/db";
import { requireAuth, getCurrentWorkspace } from "../../lib/auth";

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
  let query = db.select().from(auditsTable).where(eq(auditsTable.workspaceId, workspace.id));

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

  const [audit] = await db
    .insert(auditsTable)
    .values({
      workspaceId: workspace.id,
      url: url.startsWith("http") ? url : `https://${url}`,
      websiteName,
      status: "running",
      tone,
      reportStyle,
    })
    .returning();

  // Simulate async audit processing
  setTimeout(async () => {
    const scores = {
      overallScore: Math.floor(Math.random() * 40) + 45,
      seoScore: Math.floor(Math.random() * 50) + 40,
      performanceScore: Math.floor(Math.random() * 50) + 35,
      accessibilityScore: Math.floor(Math.random() * 40) + 50,
      uxScore: Math.floor(Math.random() * 45) + 40,
      conversionScore: Math.floor(Math.random() * 45) + 30,
      mobileScore: Math.floor(Math.random() * 40) + 45,
    };

    const aiSummary = `This website shows significant opportunities for improvement across multiple dimensions. The site has foundational SEO elements in place but lacks structured data and proper meta optimization. Performance scores indicate render-blocking resources and unoptimized images causing slow load times. The mobile experience needs work with touch targets that are too small and content that requires horizontal scrolling.`;

    const aiRecommendations = `1. **SEO Quick Wins**: Add missing meta descriptions and implement schema markup for better search visibility. Target long-tail keywords relevant to your niche.\n\n2. **Performance**: Compress images using WebP format, implement lazy loading, and defer non-critical JavaScript. This alone could improve your score by 20+ points.\n\n3. **Mobile Experience**: Redesign the navigation for mobile users. Current hamburger menu implementation has usability issues.\n\n4. **Conversion Optimization**: Add a clear value proposition above the fold. Your current CTA placement has poor visibility — move primary CTAs higher on the page.\n\n5. **Trust Signals**: Add customer testimonials, trust badges, and a clear privacy policy link to increase visitor confidence.`;

    const [updated] = await db
      .update(auditsTable)
      .set({
        ...scores,
        status: "completed",
        aiSummary,
        aiRecommendations,
        completedAt: new Date(),
      })
      .where(eq(auditsTable.id, audit.id))
      .returning();

    // Add sample issues
    const issues = [
      { category: "seo", severity: "high", title: "Missing meta descriptions", description: "Several pages are missing meta descriptions which are critical for search rankings and click-through rates.", recommendation: "Add unique, compelling meta descriptions to all pages.", impact: "High impact on SEO rankings" },
      { category: "performance", severity: "high", title: "Unoptimized images", description: "Images are not compressed or served in modern formats like WebP. This significantly increases page load time.", recommendation: "Convert all images to WebP format and implement lazy loading.", impact: "30-50% improvement in page load speed" },
      { category: "accessibility", severity: "medium", title: "Low color contrast", description: "Several text elements don't meet WCAG 2.1 AA contrast requirements.", recommendation: "Increase text-to-background contrast ratios to at least 4.5:1.", impact: "Affects users with visual impairments" },
      { category: "ux", severity: "medium", title: "No clear call-to-action", description: "The primary CTA button is not prominently placed above the fold on mobile.", recommendation: "Move the primary CTA above the fold and make it more visually prominent.", impact: "Could increase conversion rate by 15-25%" },
      { category: "seo", severity: "low", title: "Missing structured data", description: "No JSON-LD schema markup detected on key pages.", recommendation: "Add structured data markup for better rich results in search.", impact: "Improved search result appearance" },
    ];

    for (const issue of issues) {
      await db.insert(auditIssuesTable).values({ auditId: audit.id, ...issue });
    }
  }, 3000);

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
  const { tone = "professional", style = "detailed" } = req.body;

  const newSummary = `[Regenerated with ${tone} tone] This website analysis reveals key areas requiring immediate attention. The site performance metrics indicate substantial room for improvement in both technical SEO and user experience dimensions. With focused optimization efforts, significant ranking and conversion improvements are achievable within 60-90 days.`;

  const [updated] = await db
    .update(auditsTable)
    .set({ aiSummary: newSummary, tone, reportStyle: style })
    .where(eq(auditsTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const issues = await db.select().from(auditIssuesTable).where(eq(auditIssuesTable.auditId, id));
  res.json({
    id: updated.id,
    workspaceId: updated.workspaceId,
    url: updated.url,
    websiteName: updated.websiteName,
    status: updated.status,
    overallScore: updated.overallScore,
    seoScore: updated.seoScore,
    performanceScore: updated.performanceScore,
    accessibilityScore: updated.accessibilityScore,
    uxScore: updated.uxScore,
    conversionScore: updated.conversionScore,
    mobileScore: updated.mobileScore,
    screenshotUrl: updated.screenshotUrl,
    aiSummary: updated.aiSummary,
    aiRecommendations: updated.aiRecommendations,
    issues: issues.map(i => ({ id: i.id, auditId: i.auditId, category: i.category, severity: i.severity, title: i.title, description: i.description, recommendation: i.recommendation, impact: i.impact })),
    issueCount: issues.length,
    createdAt: updated.createdAt.toISOString(),
    completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
  });
});

export default router;
