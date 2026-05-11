import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  businessName: text("business_name").notNull(),
  website: text("website"),
  contactEmail: text("contact_email"),
  contactName: text("contact_name"),
  phone: text("phone"),
  location: text("location"),
  niche: text("niche"),
  status: text("status").notNull().default("new"),
  auditScore: integer("audit_score"),
  auditId: integer("audit_id"),
  tags: text("tags").array().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
