import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  company: text("company"),
  status: text("status").notNull().default("prospect"),
  avatarUrl: text("avatar_url"),
  totalRevenue: real("total_revenue").notNull().default(0),
  activeProposals: integer("active_proposals").notNull().default(0),
  completedProjects: integer("completed_projects").notNull().default(0),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const clientNotesTable = pgTable("client_notes", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  content: text("content").notNull(),
  authorName: text("author_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityEventsTable = pgTable("activity_events", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClientSchema = createInsertSchema(clientsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientNoteSchema = createInsertSchema(clientNotesTable).omit({ id: true, createdAt: true });
export const insertActivityEventSchema = createInsertSchema(activityEventsTable).omit({ id: true, createdAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
export type ClientNote = typeof clientNotesTable.$inferSelect;
export type ActivityEvent = typeof activityEventsTable.$inferSelect;
