import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { accounts } from "../../../accounts/infrastructure/persistence/accounts.schema";
import { users } from "../../../users/infrastructure/persistence/users.schema";

export const transfers = sqliteTable("transfers", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  fromAccountId: text("from_account_id")
    .notNull()
    .references(() => accounts.id),
  toAccountId: text("to_account_id")
    .notNull()
    .references(() => accounts.id),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => users.id),
  amount: integer("amount").notNull(),
  description: text("description"),
  occurredAt: text("occurred_at").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
});
