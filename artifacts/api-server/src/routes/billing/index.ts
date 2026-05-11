import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { subscriptionsTable } from "@workspace/db";
import { requireAuth, getCurrentWorkspace } from "../../lib/auth";

const router = Router();

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    auditLimit: 5,
    leadLimit: 25,
    features: ["5 website audits/month", "25 leads", "Basic proposals", "Email outreach", "1 workspace"],
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    interval: "month",
    auditLimit: 50,
    leadLimit: 500,
    features: ["50 website audits/month", "500 leads", "AI-powered proposals", "Campaign automation", "White-label reports", "3 workspaces", "Priority support"],
    highlighted: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: 249,
    interval: "month",
    auditLimit: 500,
    leadLimit: 5000,
    features: ["500 website audits/month", "5,000 leads", "Full white-label", "Custom domain", "Team members", "CRM integration", "API access", "Dedicated support"],
    highlighted: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 999,
    interval: "month",
    auditLimit: -1,
    leadLimit: -1,
    features: ["Unlimited audits", "Unlimited leads", "Full white-label suite", "Custom integrations", "SLA guarantee", "Dedicated account manager", "Custom contracts"],
    highlighted: false,
  },
];

router.get("/billing/subscription", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.status(404).json({ error: "No workspace" }); return; }

  let sub = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.workspaceId, workspace.id)).then(r => r[0]);

  if (!sub) {
    [sub] = await db.insert(subscriptionsTable).values({ workspaceId: workspace.id, plan: "free", status: "active", auditLimit: 5, auditsUsed: 0, leadLimit: 25, leadsUsed: 0 }).returning();
  }

  res.json({
    id: sub.id,
    workspaceId: sub.workspaceId,
    plan: sub.plan,
    status: sub.status,
    auditLimit: sub.auditLimit,
    auditsUsed: sub.auditsUsed,
    leadLimit: sub.leadLimit,
    leadsUsed: sub.leadsUsed,
    currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    createdAt: sub.createdAt.toISOString(),
  });
});

router.get("/billing/plans", async (_req, res): Promise<void> => {
  res.json(PLANS);
});

export default router;
