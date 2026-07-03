import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  parentId: text("parent_id").references((): AnySQLiteColumn => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
