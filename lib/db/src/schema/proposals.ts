import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const proposalsTable = pgTable("proposals", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  clientId: integer("client_id"),
  leadId: integer("lead_id"),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  totalValue: real("total_value").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const proposalServicesTable = pgTable("proposal_services", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull().default(0),
  quantity: integer("quantity").notNull().default(1),
  recurring: boolean("recurring").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProposalSchema = createInsertSchema(proposalsTable).omit({ id: true, createdAt: true, updatedAt: true, sentAt: true, acceptedAt: true });
export const insertProposalServiceSchema = createInsertSchema(proposalServicesTable).omit({ id: true, createdAt: true });
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposalsTable.$inferSelect;
export type ProposalService = typeof proposalServicesTable.$inferSelect;
