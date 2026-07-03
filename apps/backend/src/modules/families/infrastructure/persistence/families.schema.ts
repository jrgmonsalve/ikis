import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const families = sqliteTable("families", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
