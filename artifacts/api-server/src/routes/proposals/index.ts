import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { proposalsTable, proposalServicesTable } from "@workspace/db";
import { requireAuth, getCurrentWorkspace } from "../../lib/auth";

const router = Router();

async function formatProposal(p: any) {
  const services = await db.select().from(proposalServicesTable).where(eq(proposalServicesTable.proposalId, p.id));
  return {
    id: p.id,
    workspaceId: p.workspaceId,
    clientId: p.clientId,
    leadId: p.leadId,
    title: p.title,
    status: p.status,
    totalValue: p.totalValue,
    currency: p.currency,
    validUntil: p.validUntil ? p.validUntil.toISOString() : null,
    sentAt: p.sentAt ? p.sentAt.toISOString() : null,
    acceptedAt: p.acceptedAt ? p.acceptedAt.toISOString() : null,
    viewCount: p.viewCount,
    services: services.map(s => ({ id: s.id, proposalId: s.proposalId, name: s.name, description: s.description, price: s.price, quantity: s.quantity, recurring: s.recurring })),
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/proposals", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.json([]); return; }

  const { status, clientId } = req.query as Record<string, string>;
  const conditions = [eq(proposalsTable.workspaceId, workspace.id)];
  if (status) conditions.push(eq(proposalsTable.status, status));
  if (clientId) conditions.push(eq(proposalsTable.clientId, parseInt(clientId)));

  const proposals = await db.select().from(proposalsTable).where(and(...conditions)).orderBy(desc(proposalsTable.createdAt));
  const formatted = await Promise.all(proposals.map(formatProposal));
  res.json(formatted);
});

router.post("/proposals", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.status(404).json({ error: "No workspace" }); return; }

  const { title, clientId, leadId, currency = "USD", validUntil, services = [] } = req.body;

  const totalValue = services.length > 0
    ? services.reduce((sum: number, s: any) => sum + (s.price * (s.quantity || 1)), 0)
    : (req.body.totalValue ?? 0);

  const [proposal] = await db
    .insert(proposalsTable)
    .values({ workspaceId: workspace.id, title, clientId, leadId, currency, totalValue, status: "draft", validUntil: validUntil ? new Date(validUntil) : undefined })
    .returning();

  for (const s of services) {
    await db.insert(proposalServicesTable).values({ proposalId: proposal.id, name: s.name, description: s.description, price: s.price, quantity: s.quantity || 1, recurring: s.recurring || false });
  }

  res.status(201).json(await formatProposal(proposal));
});

router.get("/proposals/stats", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.json({ total: 0, draft: 0, sent: 0, accepted: 0, declined: 0, totalValue: 0, acceptedValue: 0, acceptanceRate: 0 }); return; }

  const proposals = await db.select().from(proposalsTable).where(eq(proposalsTable.workspaceId, workspace.id));
  const counts = { draft: 0, sent: 0, accepted: 0, declined: 0 };
  let totalValue = 0, acceptedValue = 0;

  for (const p of proposals) {
    const s = p.status as keyof typeof counts;
    if (s in counts) counts[s]++;
    totalValue += p.totalValue;
    if (p.status === "accepted") acceptedValue += p.totalValue;
  }

  const sent = counts.sent + counts.accepted + counts.declined;
  const acceptanceRate = sent > 0 ? (counts.accepted / sent) * 100 : 0;

  res.json({ total: proposals.length, ...counts, totalValue, acceptedValue, acceptanceRate: Math.round(acceptanceRate * 10) / 10 });
});

router.get("/proposals/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const proposal = await db.select().from(proposalsTable).where(eq(proposalsTable.id, id)).then(r => r[0]);
  if (!proposal) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatProposal(proposal));
});

router.patch("/proposals/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { title, status, currency, validUntil } = req.body;
  const [p] = await db.update(proposalsTable).set({ title, status, currency, validUntil: validUntil ? new Date(validUntil) : undefined }).where(eq(proposalsTable.id, id)).returning();
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatProposal(p));
});

router.delete("/proposals/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(proposalServicesTable).where(eq(proposalServicesTable.proposalId, id));
  await db.delete(proposalsTable).where(eq(proposalsTable.id, id));
  res.sendStatus(204);
});

router.post("/proposals/:id/send", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [p] = await db.update(proposalsTable).set({ status: "sent", sentAt: new Date() }).where(eq(proposalsTable.id, id)).returning();
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatProposal(p));
});

router.post("/proposals/:id/accept", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [p] = await db.update(proposalsTable).set({ status: "accepted", acceptedAt: new Date() }).where(eq(proposalsTable.id, id)).returning();
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatProposal(p));
});

export default router;
