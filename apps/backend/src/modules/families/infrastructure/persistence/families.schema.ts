import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const families = sqliteTable("families", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  budgetCycleEndDay: integer("budget_cycle_end_day").notNull().default(31),
  definedCycleStart: text("defined_cycle_start"),
  definedCycleEnd: text("defined_cycle_end"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
