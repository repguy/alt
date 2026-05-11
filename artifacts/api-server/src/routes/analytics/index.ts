import { Router } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { auditsTable, leadsTable, proposalsTable, clientsTable, activityEventsTable } from "@workspace/db";
import { requireAuth, getCurrentWorkspace } from "../../lib/auth";

const router = Router();

router.get("/analytics/dashboard", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) {
    res.json({
      totalLeads: 0, totalAudits: 0, totalProposals: 0, totalClients: 0,
      totalRevenue: 0, activeDeals: 0, proposalAcceptanceRate: 0,
      avgAuditScore: 0, leadsThisMonth: 0, auditsThisMonth: 0,
      revenueThisMonth: 0, recentActivity: [], topLeadNiches: [],
    });
    return;
  }

  const wid = workspace.id;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [leads, audits, proposals, clients, recentActivity] = await Promise.all([
    db.select().from(leadsTable).where(eq(leadsTable.workspaceId, wid)),
    db.select().from(auditsTable).where(eq(auditsTable.workspaceId, wid)),
    db.select().from(proposalsTable).where(eq(proposalsTable.workspaceId, wid)),
    db.select().from(clientsTable).where(eq(clientsTable.workspaceId, wid)),
    db.select().from(activityEventsTable).where(eq(activityEventsTable.workspaceId, wid)).orderBy(desc(activityEventsTable.createdAt)).limit(10),
  ]);

  const acceptedProposals = proposals.filter(p => p.status === "accepted");
  const sentProposals = proposals.filter(p => ["sent", "accepted", "declined"].includes(p.status));
  const totalRevenue = acceptedProposals.reduce((s, p) => s + p.totalValue, 0);
  const avgAuditScore = audits.filter(a => a.overallScore).reduce((s, a, _, arr) => s + (a.overallScore || 0) / arr.length, 0);

  const nicheCounts: Record<string, number> = {};
  for (const lead of leads) {
    if (lead.niche) nicheCounts[lead.niche] = (nicheCounts[lead.niche] || 0) + 1;
  }

  const leadsThisMonth = leads.filter(l => new Date(l.createdAt) >= monthStart).length;
  const auditsThisMonth = audits.filter(a => new Date(a.createdAt) >= monthStart).length;
  const revenueThisMonth = acceptedProposals.filter(p => p.acceptedAt && new Date(p.acceptedAt) >= monthStart).reduce((s, p) => s + p.totalValue, 0);

  res.json({
    totalLeads: leads.length,
    totalAudits: audits.length,
    totalProposals: proposals.length,
    totalClients: clients.length,
    totalRevenue,
    activeDeals: proposals.filter(p => p.status === "sent").length,
    proposalAcceptanceRate: sentProposals.length > 0 ? Math.round((acceptedProposals.length / sentProposals.length) * 1000) / 10 : 0,
    avgAuditScore: Math.round(avgAuditScore * 10) / 10,
    leadsThisMonth,
    auditsThisMonth,
    revenueThisMonth,
    recentActivity: recentActivity.map(e => ({
      id: e.id,
      type: e.type,
      description: e.description,
      entityType: e.entityType,
      entityId: e.entityId,
      metadata: e.metadata,
      createdAt: e.createdAt.toISOString(),
    })),
    topLeadNiches: Object.entries(nicheCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([niche, count]) => ({ niche, count })),
  });
});

router.get("/analytics/revenue", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.json({ mrr: 0, arr: 0, totalRevenue: 0, monthlyData: [] }); return; }

  const proposals = await db.select().from(proposalsTable).where(eq(proposalsTable.workspaceId, workspace.id));
  const accepted = proposals.filter(p => p.status === "accepted");
  const totalRevenue = accepted.reduce((s, p) => s + p.totalValue, 0);
  const mrr = totalRevenue / 12;

  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const monthRevenue = accepted.filter(p => {
      if (!p.acceptedAt) return false;
      const ad = new Date(p.acceptedAt);
      return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
    }).reduce((s, p) => s + p.totalValue, 0);
    const monthProposals = proposals.filter(p => {
      const pd = new Date(p.createdAt);
      return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
    }).length;
    months.push({ month: monthStr, revenue: monthRevenue, proposals: monthProposals });
  }

  res.json({ mrr, arr: mrr * 12, totalRevenue, monthlyData: months });
});

router.get("/analytics/activity", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.json([]); return; }

  const { limit = "20" } = req.query as Record<string, string>;
  const events = await db.select().from(activityEventsTable)
    .where(eq(activityEventsTable.workspaceId, workspace.id))
    .orderBy(desc(activityEventsTable.createdAt))
    .limit(parseInt(limit));

  res.json(events.map(e => ({ id: e.id, type: e.type, description: e.description, entityType: e.entityType, entityId: e.entityId, metadata: e.metadata, createdAt: e.createdAt.toISOString() })));
});

export default router;
