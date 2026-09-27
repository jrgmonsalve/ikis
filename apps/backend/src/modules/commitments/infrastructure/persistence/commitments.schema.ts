import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const commitments = sqliteTable("commitments", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  name: text("name").notNull(),
  amountLimit: integer("amount_limit").notNull(),
  dueDay: integer("due_day").notNull(),
  notifyDaysBefore: integer("notify_days_before").notNull().default(3),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
