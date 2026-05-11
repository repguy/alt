import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, workspacesTable, workspaceMembersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let user = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).then(r => r[0]);

  if (!user) {
    const email = (auth as any)?.sessionClaims?.email as string || "";
    const name = (auth as any)?.sessionClaims?.name as string || null;
    [user] = await db.insert(usersTable).values({
      clerkId,
      email,
      name,
      role: "owner",
      plan: "free",
      onboardingCompleted: false,
    }).returning();

    // Create default workspace
    const slug = `workspace-${user.id}`;
    const [workspace] = await db.insert(workspacesTable).values({
      name: name ? `${name}'s Agency` : "My Agency",
      slug,
      ownerId: user.id,
      plan: "free",
    }).returning();

    // Add user as owner member
    await db.insert(workspaceMembersTable).values({
      workspaceId: workspace.id,
      userId: user.id,
      email: email,
      name: name,
      role: "owner",
      status: "active",
    });
  }

  (req as any).currentUser = user;
  next();
}

export async function getCurrentWorkspace(req: Request): Promise<{ id: number } | null> {
  const user = (req as any).currentUser;
  if (!user) return null;

  const workspace = await db
    .select({ id: workspacesTable.id })
    .from(workspacesTable)
    .where(eq(workspacesTable.ownerId, user.id))
    .then(r => r[0]);

  return workspace || null;
}
