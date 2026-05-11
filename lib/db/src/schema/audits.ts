import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auditsTable = pgTable("audits", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  url: text("url").notNull(),
  websiteName: text("website_name"),
  status: text("status").notNull().default("pending"),
  overallScore: integer("overall_score"),
  seoScore: integer("seo_score"),
  performanceScore: integer("performance_score"),
  accessibilityScore: integer("accessibility_score"),
  uxScore: integer("ux_score"),
  conversionScore: integer("conversion_score"),
  mobileScore: integer("mobile_score"),
  screenshotUrl: text("screenshot_url"),
  aiSummary: text("ai_summary"),
  aiRecommendations: text("ai_recommendations"),
  tone: text("tone").default("professional"),
  reportStyle: text("report_style").default("detailed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const auditIssuesTable = pgTable("audit_issues", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull().default("medium"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  recommendation: text("recommendation"),
  impact: text("impact"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuditSchema = createInsertSchema(auditsTable).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export const insertAuditIssueSchema = createInsertSchema(auditIssuesTable).omit({ id: true, createdAt: true });
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof auditsTable.$inferSelect;
export type AuditIssue = typeof auditIssuesTable.$inferSelect;
