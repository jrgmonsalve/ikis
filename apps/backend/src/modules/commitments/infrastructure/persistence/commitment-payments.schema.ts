import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { commitments } from "./commitments.schema";

export const commitmentPayments = sqliteTable(
  "commitment_payments",
  {
    id: text("id").primaryKey(),
    familyId: text("family_id").notNull(),
    commitmentId: text("commitment_id")
      .notNull()
      .references(() => commitments.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [unique().on(table.familyId, table.commitmentId, table.period)],
);
