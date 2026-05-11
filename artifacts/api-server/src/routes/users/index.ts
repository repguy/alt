import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { requireAuth } from "../../lib/auth";

const router = Router();

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).currentUser;
  res.json({
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    plan: user.plan,
    onboardingCompleted: user.onboardingCompleted,
    agencyName: user.agencyName,
    agencyWebsite: user.agencyWebsite,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/users/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).currentUser;
  const { name, agencyName, agencyWebsite, avatarUrl } = req.body;

  const [updated] = await db
    .update(usersTable)
    .set({ name, agencyName, agencyWebsite, avatarUrl })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json({
    id: updated.id,
    clerkId: updated.clerkId,
    email: updated.email,
    name: updated.name,
    avatarUrl: updated.avatarUrl,
    role: updated.role,
    plan: updated.plan,
    onboardingCompleted: updated.onboardingCompleted,
    agencyName: updated.agencyName,
    agencyWebsite: updated.agencyWebsite,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.post("/users/onboarding", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).currentUser;
  const { agencyName, role, agencyWebsite, teamSize, useCase } = req.body;

  const [updated] = await db
    .update(usersTable)
    .set({ agencyName, agencyWebsite, onboardingCompleted: true })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json({
    id: updated.id,
    clerkId: updated.clerkId,
    email: updated.email,
    name: updated.name,
    avatarUrl: updated.avatarUrl,
    role: updated.role,
    plan: updated.plan,
    onboardingCompleted: updated.onboardingCompleted,
    agencyName: updated.agencyName,
    agencyWebsite: updated.agencyWebsite,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
