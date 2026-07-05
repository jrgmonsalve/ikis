import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { categories } from "../../../categories/infrastructure/persistence/categories.schema";

export const budgets = sqliteTable(
  "budgets",
  {
    id: text("id").primaryKey(),
    familyId: text("family_id").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    amountLimit: integer("amount_limit").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [unique().on(table.familyId, table.categoryId, table.period)],
);
