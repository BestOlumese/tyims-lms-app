import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
