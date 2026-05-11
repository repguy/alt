import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"),
  type: text("type").notNull().default("email"),
  subject: text("subject"),
  body: text("body"),
  sentCount: integer("sent_count").notNull().default(0),
  openCount: integer("open_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  openRate: real("open_rate").notNull().default(0),
  replyRate: real("reply_rate").notNull().default(0),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  launchedAt: timestamp("launched_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const campaignEmailsTable = pgTable("campaign_emails", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  toEmail: text("to_email").notNull(),
  toName: text("to_name"),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("pending"),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, createdAt: true, updatedAt: true, launchedAt: true });
export const insertCampaignEmailSchema = createInsertSchema(campaignEmailsTable).omit({ id: true, createdAt: true, openedAt: true, repliedAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;
export type CampaignEmail = typeof campaignEmailsTable.$inferSelect;
