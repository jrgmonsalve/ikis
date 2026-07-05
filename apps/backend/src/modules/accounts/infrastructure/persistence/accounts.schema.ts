import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  name: text("name").notNull(),
  type: text("type", { enum: ["checking", "savings", "credit_card", "cash"] }).notNull(),
  currency: text("currency").notNull().default("COP"),
  balance: integer("balance").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
