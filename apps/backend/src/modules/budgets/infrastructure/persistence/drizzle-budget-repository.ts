import { and, eq, gte, isNull, lt, sql } from "drizzle-orm";
import type { Db } from "../../../../shared/db";
import { transactions } from "../../../transactions/infrastructure/persistence/transactions.schema";
import type { Budget, BudgetStatus } from "../../domain/budget";
import type { BudgetChanges, BudgetRepository, NewBudget } from "../../domain/budget-repository";
import { budgets } from "./budgets.schema";

const startsInMonth = (publicPeriod: string) => sql`substr(${budgets.period}, 1, 7) = ${publicPeriod}`;

export class DrizzleBudgetRepository implements BudgetRepository {
  constructor(private readonly db: Db) {}

  async findById(familyId: string, id: string): Promise<Budget | null> {
    const [row] = await this.db
      .select()
      .from(budgets)
      .where(and(eq(budgets.familyId, familyId), eq(budgets.id, id)))
      .limit(1);
    return row ?? null;
  }

  async findByFamilyCategoryAndPeriod(
    familyId: string,
    categoryId: string,
    publicPeriod: string,
  ): Promise<Budget | null> {
    const [row] = await this.db
      .select()
      .from(budgets)
      .where(and(eq(budgets.familyId, familyId), eq(budgets.categoryId, categoryId), startsInMonth(publicPeriod)))
      .limit(1);
    return row ?? null;
  }

  async create(input: NewBudget): Promise<Budget> {
    const row: Budget = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...input,
    };

    await this.db.insert(budgets).values(row);

    return row;
  }

  async update(familyId: string, id: string, changes: BudgetChanges): Promise<Budget> {
    await this.db
      .update(budgets)
      .set(changes)
      .where(and(eq(budgets.familyId, familyId), eq(budgets.id, id)));

    const updated = await this.findById(familyId, id);
    if (!updated) {
      throw new Error("Budget not found");
    }

    return updated;
  }

  async getStatusForPeriod(familyId: string, publicPeriod: string): Promise<BudgetStatus[]> {
    return this.db
      .select({
        id: budgets.id,
        categoryId: budgets.categoryId,
        amountLimit: budgets.amountLimit,
        spent: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN -${transactions.amount} ELSE 0 END), 0)`.mapWith(
          Number,
        ),
      })
      .from(budgets)
      .leftJoin(
        transactions,
        and(
          eq(transactions.familyId, budgets.familyId),
          eq(transactions.categoryId, budgets.categoryId),
          gte(transactions.occurredAt, budgets.period),
          lt(transactions.occurredAt, sql`date(${budgets.period}, '+1 month')`),
          isNull(transactions.deletedAt),
        ),
      )
      .where(and(eq(budgets.familyId, familyId), startsInMonth(publicPeriod)))
      .groupBy(budgets.id);
  }
}
