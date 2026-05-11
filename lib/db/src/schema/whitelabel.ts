import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const whitelabelConfigsTable = pgTable("whitelabel_configs", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().unique(),
  brandName: text("brand_name").notNull().default("ALT"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color"),
  accentColor: text("accent_color"),
  fontFamily: text("font_family"),
  customDomain: text("custom_domain"),
  domainVerified: boolean("domain_verified").notNull().default(false),
  hideAltBranding: boolean("hide_alt_branding").notNull().default(false),
  customEmailFrom: text("custom_email_from"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWhitelabelConfigSchema = createInsertSchema(whitelabelConfigsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWhitelabelConfig = z.infer<typeof insertWhitelabelConfigSchema>;
export type WhitelabelConfig = typeof whitelabelConfigsTable.$inferSelect;
