import { and, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import type { Db } from "../../../../shared/db";
import { categories } from "../../../categories/infrastructure/persistence/categories.schema";
import { transactions } from "../../../transactions/infrastructure/persistence/transactions.schema";
import type { Budget, BudgetStatus } from "../../domain/budget";
import type { BudgetChanges, BudgetRepository, NewBudget } from "../../domain/budget-repository";
import { budgets } from "./budgets.schema";

const activeOn = (date: string) => and(lte(budgets.period, date), gte(budgets.periodEnd, date));

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

  async findActiveOn(familyId: string, date: string): Promise<Budget[]> {
    return this.db
      .select()
      .from(budgets)
      .where(and(eq(budgets.familyId, familyId), activeOn(date)));
  }

  async findLatestCycle(familyId: string): Promise<Budget[]> {
    const [latest] = await this.db
      .select({ periodEnd: sql<string | null>`MAX(${budgets.periodEnd})` })
      .from(budgets)
      .where(eq(budgets.familyId, familyId));
    if (!latest?.periodEnd) {
      return [];
    }

    return this.db
      .select()
      .from(budgets)
      .where(and(eq(budgets.familyId, familyId), eq(budgets.periodEnd, latest.periodEnd)));
  }

  async findPreviousCycleEnd(familyId: string, beforePeriod: string): Promise<string | null> {
    const [row] = await this.db
      .select({ periodEnd: sql<string | null>`MAX(${budgets.periodEnd})` })
      .from(budgets)
      .where(and(eq(budgets.familyId, familyId), sql`${budgets.periodEnd} < ${beforePeriod}`));
    return row?.periodEnd ?? null;
  }

  async redateCycle(familyId: string, fromPeriod: string, cycle: { start: string; end: string }): Promise<void> {
    await this.db
      .update(budgets)
      .set({ period: cycle.start, periodEnd: cycle.end })
      .where(and(eq(budgets.familyId, familyId), eq(budgets.period, fromPeriod)));
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

  async createMany(inputs: NewBudget[]): Promise<void> {
    if (inputs.length === 0) {
      return;
    }

    await this.db.insert(budgets).values(
      inputs.map((input) => ({
        id: crypto.randomUUID(),
        createdAt: new Date(),
        ...input,
      })),
    );
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

  async getStatusActiveOn(familyId: string, date: string): Promise<BudgetStatus[]> {
    return this.db
      .select({
        id: budgets.id,
        categoryId: budgets.categoryId,
        period: budgets.period,
        periodEnd: budgets.periodEnd,
        amountLimit: budgets.amountLimit,
        spent: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN -${transactions.amount} ELSE 0 END), 0)`.mapWith(
          Number,
        ),
      })
      .from(budgets)
      .leftJoin(categories, or(eq(categories.id, budgets.categoryId), eq(categories.parentId, budgets.categoryId)))
      .leftJoin(
        transactions,
        and(
          eq(transactions.familyId, budgets.familyId),
          eq(transactions.categoryId, categories.id),
          gte(transactions.occurredAt, budgets.period),
          lte(transactions.occurredAt, budgets.periodEnd),
          isNull(transactions.deletedAt),
        ),
      )
      .where(and(eq(budgets.familyId, familyId), activeOn(date)))
      .groupBy(budgets.id);
  }
}
