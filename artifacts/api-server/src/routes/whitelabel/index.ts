import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { whitelabelConfigsTable } from "@workspace/db";
import { requireAuth, getCurrentWorkspace } from "../../lib/auth";

const router = Router();

function formatConfig(c: any) {
  return {
    id: c.id,
    workspaceId: c.workspaceId,
    brandName: c.brandName,
    logoUrl: c.logoUrl,
    faviconUrl: c.faviconUrl,
    primaryColor: c.primaryColor,
    accentColor: c.accentColor,
    fontFamily: c.fontFamily,
    customDomain: c.customDomain,
    domainVerified: c.domainVerified,
    hideAltBranding: c.hideAltBranding,
    customEmailFrom: c.customEmailFrom,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/whitelabel", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.status(404).json({ error: "No workspace" }); return; }

  let config = await db.select().from(whitelabelConfigsTable).where(eq(whitelabelConfigsTable.workspaceId, workspace.id)).then(r => r[0]);

  if (!config) {
    [config] = await db.insert(whitelabelConfigsTable).values({ workspaceId: workspace.id, brandName: "ALT" }).returning();
  }

  res.json(formatConfig(config));
});

router.patch("/whitelabel", requireAuth, async (req, res): Promise<void> => {
  const workspace = await getCurrentWorkspace(req);
  if (!workspace) { res.status(404).json({ error: "No workspace" }); return; }

  const { brandName, logoUrl, faviconUrl, primaryColor, accentColor, fontFamily, customDomain, hideAltBranding, customEmailFrom } = req.body;

  let config = await db.select().from(whitelabelConfigsTable).where(eq(whitelabelConfigsTable.workspaceId, workspace.id)).then(r => r[0]);

  if (!config) {
    [config] = await db.insert(whitelabelConfigsTable).values({ workspaceId: workspace.id, brandName: brandName || "ALT", logoUrl, faviconUrl, primaryColor, accentColor, fontFamily, customDomain, hideAltBranding, customEmailFrom }).returning();
  } else {
    [config] = await db.update(whitelabelConfigsTable).set({ brandName, logoUrl, faviconUrl, primaryColor, accentColor, fontFamily, customDomain, hideAltBranding, customEmailFrom }).where(eq(whitelabelConfigsTable.workspaceId, workspace.id)).returning();
  }

  res.json(formatConfig(config));
});

export default router;
