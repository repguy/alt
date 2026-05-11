import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { clientsTable, clientNotesTable, activityEventsTable } from "@workspace/db";
import { requireAuth, getCurrentWorkspace } from "../../lib/auth";

const router = Router();

function formatClient(c: any) {
  return {
    id: c.id,
    workspaceId: c.workspaceId,
    name: c.name,
    email: c.email,
    phone: c.phone,
    website: c.website,
    company: c.company,
    status: c.status,
    avatarUrl: c.avatarUrl,
    totalRevenue: c.totalRevenue,
    activeProposals: c.activeProposals,
    completedProjects: c.completedProjects,
    tags: c.tags || [],
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/clients", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.json([]); return; }

  const { status, limit = "50", offset = "0" } = req.query as Record<string, string>;
  const conditions = [eq(clientsTable.workspaceId, workspace.id)];
  if (status) conditions.push(eq(clientsTable.status, status));

  const clients = await db.select().from(clientsTable).where(and(...conditions)).orderBy(desc(clientsTable.createdAt)).limit(parseInt(limit)).offset(parseInt(offset));
  res.json(clients.map(formatClient));
});

router.post("/clients", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.status(404).json({ error: "No workspace" }); return; }

  const { name, email, phone, website, company, tags } = req.body;
  const [client] = await db.insert(clientsTable).values({ workspaceId: workspace.id, name, email, phone, website, company, tags, status: "prospect" }).returning();
  res.status(201).json(formatClient(client));
});

router.get("/clients/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const client = await db.select().from(clientsTable).where(eq(clientsTable.id, id)).then(r => r[0]);
  if (!client) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatClient(client));
});

router.patch("/clients/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, email, phone, website, company, status, tags } = req.body;
  const [c] = await db.update(clientsTable).set({ name, email, phone, website, company, status, tags }).where(eq(clientsTable.id, id)).returning();
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatClient(c));
});

router.delete("/clients/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(clientNotesTable).where(eq(clientNotesTable.clientId, id));
  await db.delete(clientsTable).where(eq(clientsTable.id, id));
  res.sendStatus(204);
});

router.get("/clients/:id/notes", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const notes = await db.select().from(clientNotesTable).where(eq(clientNotesTable.clientId, id)).orderBy(desc(clientNotesTable.createdAt));
  res.json(notes.map(n => ({ id: n.id, clientId: n.clientId, content: n.content, authorName: n.authorName, createdAt: n.createdAt.toISOString() })));
});

router.post("/clients/:id/notes", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const user = (req as any).currentUser;
  const { content } = req.body;
  const [note] = await db.insert(clientNotesTable).values({ clientId: id, content, authorName: user.name || user.email }).returning();
  res.status(201).json({ id: note.id, clientId: note.clientId, content: note.content, authorName: note.authorName, createdAt: note.createdAt.toISOString() });
});

router.get("/clients/:id/activity", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.json([]); return; }
  const events = await db.select().from(activityEventsTable).where(eq(activityEventsTable.workspaceId, workspace.id)).orderBy(desc(activityEventsTable.createdAt)).limit(20);
  res.json(events.map(e => ({ id: e.id, type: e.type, description: e.description, entityType: e.entityType, entityId: e.entityId, metadata: e.metadata, createdAt: e.createdAt.toISOString() })));
});

export default router;
