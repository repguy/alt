import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { workspacesTable, workspaceMembersTable, auditsTable, leadsTable } from "@workspace/db";
import { requireAuth } from "../../lib/auth";

const router = Router();

function formatWorkspace(ws: any, memberCount = 0, auditCount = 0, leadCount = 0) {
  return {
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    ownerId: ws.ownerId,
    plan: ws.plan,
    logoUrl: ws.logoUrl,
    primaryColor: ws.primaryColor,
    customDomain: ws.customDomain,
    memberCount,
    auditCount,
    leadCount,
    createdAt: ws.createdAt.toISOString(),
  };
}

router.get("/workspaces", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).currentUser;
  const workspaces = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.ownerId, user.id));

  const formatted = await Promise.all(workspaces.map(async ws => {
    const [{ memberCount }] = await db
      .select({ memberCount: sql<number>`count(*)::int` })
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.workspaceId, ws.id));
    const [{ auditCount }] = await db
      .select({ auditCount: sql<number>`count(*)::int` })
      .from(auditsTable)
      .where(eq(auditsTable.workspaceId, ws.id));
    const [{ leadCount }] = await db
      .select({ leadCount: sql<number>`count(*)::int` })
      .from(leadsTable)
      .where(eq(leadsTable.workspaceId, ws.id));
    return formatWorkspace(ws, memberCount, auditCount, leadCount);
  }));

  res.json(formatted);
});

router.post("/workspaces", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).currentUser;
  const { name, slug } = req.body;
  const finalSlug = slug || name.toLowerCase().replace(/\s+/g, "-");

  const [ws] = await db
    .insert(workspacesTable)
    .values({ name, slug: finalSlug, ownerId: user.id, plan: "free" })
    .returning();

  res.status(201).json(formatWorkspace(ws));
});

router.get("/workspaces/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const ws = await db.select().from(workspacesTable).where(eq(workspacesTable.id, id)).then(r => r[0]);
  if (!ws) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatWorkspace(ws));
});

router.patch("/workspaces/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, logoUrl, primaryColor, customDomain } = req.body;
  const [ws] = await db
    .update(workspacesTable)
    .set({ name, logoUrl, primaryColor, customDomain })
    .where(eq(workspacesTable.id, id))
    .returning();
  if (!ws) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatWorkspace(ws));
});

router.get("/workspaces/:id/members", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const members = await db.select().from(workspaceMembersTable).where(eq(workspaceMembersTable.workspaceId, id));
  res.json(members.map(m => ({
    id: m.id,
    workspaceId: m.workspaceId,
    userId: m.userId,
    email: m.email,
    name: m.name,
    avatarUrl: m.avatarUrl,
    role: m.role,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
  })));
});

router.post("/workspaces/:id/members", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { email, role } = req.body;
  const [member] = await db
    .insert(workspaceMembersTable)
    .values({ workspaceId: id, email, role, status: "pending" })
    .returning();
  res.status(201).json({
    id: member.id,
    workspaceId: member.workspaceId,
    userId: member.userId,
    email: member.email,
    name: member.name,
    avatarUrl: member.avatarUrl,
    role: member.role,
    status: member.status,
    createdAt: member.createdAt.toISOString(),
  });
});

export default router;
