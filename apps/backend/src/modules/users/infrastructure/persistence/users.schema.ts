import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { families } from "../../../families/infrastructure/persistence/families.schema";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  googleId: text("google_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  familyId: text("family_id").references(() => families.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
