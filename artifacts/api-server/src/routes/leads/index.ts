import { Router } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { leadsTable } from "@workspace/db";
import { requireAuth, getCurrentWorkspace } from "../../lib/auth";

const router = Router();

function formatLead(l: any) {
  return {
    id: l.id,
    workspaceId: l.workspaceId,
    businessName: l.businessName,
    website: l.website,
    contactEmail: l.contactEmail,
    contactName: l.contactName,
    phone: l.phone,
    location: l.location,
    niche: l.niche,
    status: l.status,
    auditScore: l.auditScore,
    auditId: l.auditId,
    tags: l.tags || [],
    notes: l.notes,
    createdAt: l.createdAt.toISOString(),
  };
}

router.get("/leads", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.json([]); return; }

  const { status, niche, location, limit = "50", offset = "0" } = req.query as Record<string, string>;

  const conditions = [eq(leadsTable.workspaceId, workspace.id)];
  if (status) conditions.push(eq(leadsTable.status, status));
  if (niche) conditions.push(eq(leadsTable.niche, niche));

  const leads = await db
    .select()
    .from(leadsTable)
    .where(and(...conditions))
    .orderBy(desc(leadsTable.createdAt))
    .limit(parseInt(limit))
    .offset(parseInt(offset));

  res.json(leads.map(formatLead));
});

router.post("/leads", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.status(404).json({ error: "No workspace" }); return; }

  const { businessName, website, contactEmail, contactName, phone, location, niche, notes } = req.body;
  const [lead] = await db
    .insert(leadsTable)
    .values({ workspaceId: workspace.id, businessName, website, contactEmail, contactName, phone, location, niche, notes })
    .returning();

  res.status(201).json(formatLead(lead));
});

router.post("/leads/find", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.status(404).json({ error: "No workspace" }); return; }

  const { niche, location, count = 5 } = req.body;

  // Simulate AI lead finding
  const businesses = [
    { businessName: `${location} ${niche} Solutions`, website: `${niche.toLowerCase().replace(/\s+/, "")}solutions.com`, contactEmail: `hello@${niche.toLowerCase().replace(/\s+/, "")}solutions.com`, contactName: "Sarah Johnson", auditScore: Math.floor(Math.random() * 40) + 25 },
    { businessName: `Premier ${niche} Co`, website: `premier${niche.toLowerCase().replace(/\s+/, "")}.com`, contactEmail: `info@premier${niche.toLowerCase().replace(/\s+/, "")}.com`, contactName: "Mike Wilson", auditScore: Math.floor(Math.random() * 40) + 20 },
    { businessName: `${location} ${niche} Experts`, website: `${location.toLowerCase()}${niche.toLowerCase().replace(/\s+/, "")}experts.com`, contactEmail: `contact@experts.com`, contactName: "Lisa Chen", auditScore: Math.floor(Math.random() * 35) + 30 },
    { businessName: `Top ${niche} Agency`, website: `top${niche.toLowerCase().replace(/\s+/, "")}agency.com`, contactEmail: `hello@topagency.com`, contactName: "David Park", auditScore: Math.floor(Math.random() * 45) + 15 },
    { businessName: `${niche} Pro Services`, website: `${niche.toLowerCase().replace(/\s+/, "")}proservices.io`, contactEmail: `team@proservices.io`, contactName: "Anna Martinez", auditScore: Math.floor(Math.random() * 40) + 25 },
  ];

  const inserted = await Promise.all(businesses.slice(0, count).map(async b => {
    const [lead] = await db.insert(leadsTable).values({
      workspaceId: workspace.id,
      businessName: b.businessName,
      website: `https://${b.website}`,
      contactEmail: b.contactEmail,
      contactName: b.contactName,
      location,
      niche,
      status: "new",
      auditScore: b.auditScore,
      tags: [niche, location],
    }).returning();
    return formatLead(lead);
  }));

  res.json(inserted);
});

router.get("/leads/stats", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.json({ total: 0, new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0, conversionRate: 0, byNiche: [] }); return; }

  const leads = await db.select().from(leadsTable).where(eq(leadsTable.workspaceId, workspace.id));
  const statusCounts = { new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0 };
  const nicheCounts: Record<string, number> = {};

  for (const lead of leads) {
    const s = lead.status as keyof typeof statusCounts;
    if (s in statusCounts) statusCounts[s]++;
    if (lead.niche) nicheCounts[lead.niche] = (nicheCounts[lead.niche] || 0) + 1;
  }

  const total = leads.length;
  const conversionRate = total > 0 ? (statusCounts.converted / total) * 100 : 0;

  res.json({
    total,
    ...statusCounts,
    conversionRate: Math.round(conversionRate * 10) / 10,
    byNiche: Object.entries(nicheCounts).map(([niche, count]) => ({ niche, count })),
  });
});

router.get("/leads/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const lead = await db.select().from(leadsTable).where(eq(leadsTable.id, id)).then(r => r[0]);
  if (!lead) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatLead(lead));
});

router.patch("/leads/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { businessName, status, contactEmail, contactName, notes, tags } = req.body;
  const [lead] = await db
    .update(leadsTable)
    .set({ businessName, status, contactEmail, contactName, notes, tags })
    .where(eq(leadsTable.id, id))
    .returning();
  if (!lead) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatLead(lead));
});

router.delete("/leads/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(leadsTable).where(eq(leadsTable.id, id));
  res.sendStatus(204);
});

export default router;
