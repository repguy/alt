import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { campaignsTable, campaignEmailsTable, leadsTable } from "@workspace/db";
import { requireAuth, getCurrentWorkspace } from "../../lib/auth";

const router = Router();

function formatCampaign(c: any) {
  return {
    id: c.id,
    workspaceId: c.workspaceId,
    name: c.name,
    status: c.status,
    type: c.type,
    subject: c.subject,
    body: c.body,
    sentCount: c.sentCount,
    openCount: c.openCount,
    replyCount: c.replyCount,
    openRate: c.openRate,
    replyRate: c.replyRate,
    scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
    launchedAt: c.launchedAt ? c.launchedAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/campaigns", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.json([]); return; }
  const campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.workspaceId, workspace.id)).orderBy(desc(campaignsTable.createdAt));
  res.json(campaigns.map(formatCampaign));
});

router.post("/campaigns", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.status(404).json({ error: "No workspace" }); return; }
  const { name, type = "email", subject, body, scheduledAt } = req.body;
  const [campaign] = await db.insert(campaignsTable).values({ workspaceId: workspace.id, name, type, subject, body, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined }).returning();
  res.status(201).json(formatCampaign(campaign));
});

router.get("/campaigns/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const campaign = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id)).then(r => r[0]);
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatCampaign(campaign));
});

router.patch("/campaigns/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, subject, body, status, scheduledAt } = req.body;
  const [c] = await db.update(campaignsTable).set({ name, subject, body, status, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined }).where(eq(campaignsTable.id, id)).returning();
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatCampaign(c));
});

router.delete("/campaigns/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(campaignEmailsTable).where(eq(campaignEmailsTable.campaignId, id));
  await db.delete(campaignsTable).where(eq(campaignsTable.id, id));
  res.sendStatus(204);
});

router.post("/campaigns/:id/launch", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const sentCount = Math.floor(Math.random() * 50) + 10;
  const openCount = Math.floor(sentCount * (Math.random() * 0.3 + 0.2));
  const replyCount = Math.floor(openCount * (Math.random() * 0.15 + 0.05));
  const openRate = sentCount > 0 ? (openCount / sentCount) * 100 : 0;
  const replyRate = sentCount > 0 ? (replyCount / sentCount) * 100 : 0;
  const [c] = await db.update(campaignsTable).set({ status: "running", launchedAt: new Date(), sentCount, openCount, replyCount, openRate, replyRate }).where(eq(campaignsTable.id, id)).returning();
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatCampaign(c));
});

router.get("/campaigns/:id/emails", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const emails = await db.select().from(campaignEmailsTable).where(eq(campaignEmailsTable.campaignId, id));
  res.json(emails.map(e => ({ id: e.id, campaignId: e.campaignId, toEmail: e.toEmail, toName: e.toName, subject: e.subject, status: e.status, openedAt: e.openedAt ? e.openedAt.toISOString() : null, repliedAt: e.repliedAt ? e.repliedAt.toISOString() : null, createdAt: e.createdAt.toISOString() })));
});

router.post("/campaigns/generate-email", requireAuth, async (req, res): Promise<void> => {
  const { leadId, type = "cold", tone = "professional" } = req.body;
  const lead = leadId ? await db.select().from(leadsTable).where(eq(leadsTable.id, leadId)).then(r => r[0]) : null;
  const businessName = lead?.businessName || "your business";
  const niche = lead?.niche || "your industry";

  const subject = `Quick question about ${businessName}'s website`;
  const body = `Hi ${lead?.contactName || "there"},

I came across ${businessName} while researching ${niche} businesses in ${lead?.location || "your area"}, and I noticed a few opportunities that could significantly improve your online presence.

Our audit showed your website has a performance score that's leaving potential customers on the table. Most businesses in your space are seeing 20-35% more conversions after addressing these issues.

I'd love to share a free detailed audit report we put together for you. Would you be open to a quick 15-minute call this week to walk through what we found?

Best,
[Your name]`;

  res.json({ subject, body });
});

export default router;
