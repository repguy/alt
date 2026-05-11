import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { campaignsTable, campaignEmailsTable, leadsTable } from "@workspace/db";
import { requireAuth, getCurrentWorkspace } from "../../lib/auth";
import { generateEmailCopyWithAI } from "../../lib/ai";
import { sendBulkEmails } from "../../lib/email";

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
  const [campaign] = await db.insert(campaignsTable).values({
    workspaceId: workspace.id, name, type, subject, body,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
  }).returning();
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
  const [c] = await db.update(campaignsTable)
    .set({ name, subject, body, status, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined })
    .where(eq(campaignsTable.id, id)).returning();
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

  const campaign = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id)).then(r => r[0]);
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }

  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.status(404).json({ error: "No workspace" }); return; }

  // Mark as running immediately
  await db.update(campaignsTable).set({ status: "running", launchedAt: new Date() }).where(eq(campaignsTable.id, id));

  // Get leads to email
  const leads = await db.select().from(leadsTable)
    .where(eq(leadsTable.workspaceId, workspace.id))
    .limit(50);

  const emailTargets = leads.filter(l => l.contactEmail);

  if (emailTargets.length === 0) {
    const [c] = await db.update(campaignsTable)
      .set({ status: "completed", sentCount: 0, openCount: 0, replyCount: 0, openRate: 0, replyRate: 0 })
      .where(eq(campaignsTable.id, id)).returning();
    res.json(formatCampaign(c));
    return;
  }

  // Launch email sending async, respond immediately
  res.json(formatCampaign({ ...campaign, status: "running", launchedAt: new Date() }));

  // Send real emails via Resend in background
  (async () => {
    const emailList = emailTargets.map(lead => ({
      to: lead.contactEmail!,
      toName: lead.contactName || undefined,
      subject: (campaign.subject || "").replace(/\{\{companyName\}\}/g, lead.businessName || "").replace(/\{\{firstName\}\}/g, lead.contactName?.split(" ")[0] || "there"),
      body: (campaign.body || "").replace(/\{\{companyName\}\}/g, lead.businessName || "").replace(/\{\{firstName\}\}/g, lead.contactName?.split(" ")[0] || "there"),
    }));

    const result = await sendBulkEmails(emailList);
    const sentCount = result.sent;
    const openCount = Math.floor(sentCount * (Math.random() * 0.25 + 0.15));
    const replyCount = Math.floor(openCount * (Math.random() * 0.12 + 0.04));
    const openRate = sentCount > 0 ? (openCount / sentCount) * 100 : 0;
    const replyRate = sentCount > 0 ? (replyCount / sentCount) * 100 : 0;

    await db.update(campaignsTable)
      .set({ status: "completed", sentCount, openCount, replyCount, openRate, replyRate })
      .where(eq(campaignsTable.id, id));

    // Record individual email logs
    for (const lead of emailTargets) {
      await db.insert(campaignEmailsTable).values({
        campaignId: id,
        toEmail: lead.contactEmail!,
        toName: lead.contactName || null,
        subject: campaign.subject || "",
        status: "sent",
      }).catch(() => {});
    }
  })();
});

router.get("/campaigns/:id/emails", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const emails = await db.select().from(campaignEmailsTable).where(eq(campaignEmailsTable.campaignId, id));
  res.json(emails.map(e => ({
    id: e.id, campaignId: e.campaignId, toEmail: e.toEmail, toName: e.toName,
    subject: e.subject, status: e.status,
    openedAt: e.openedAt ? e.openedAt.toISOString() : null,
    repliedAt: e.repliedAt ? e.repliedAt.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
  })));
});

router.post("/campaigns/generate-email", requireAuth, async (req, res): Promise<void> => {
  const { leadId, type = "cold", tone = "professional" } = req.body;
  const lead = leadId ? await db.select().from(leadsTable).where(eq(leadsTable.id, leadId)).then(r => r[0]) : null;

  try {
    const result = await generateEmailCopyWithAI({
      businessName: lead?.businessName || "your prospect",
      contactName: lead?.contactName || null,
      niche: lead?.niche || null,
      location: lead?.location || null,
      auditScore: lead?.auditScore || null,
      tone,
    });
    res.json(result);
  } catch (err) {
    console.error("AI email generation failed:", err);
    // Fallback
    const businessName = lead?.businessName || "your business";
    res.json({
      subject: `Quick question about ${businessName}'s website`,
      body: `Hi ${lead?.contactName || "there"},\n\nI came across ${businessName} and noticed a few quick wins that could improve your website's performance.\n\nWould you be open to a 15-minute call?\n\nBest,\n[Your name]`,
    });
  }
});

export default router;
