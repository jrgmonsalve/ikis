import { Hono } from "hono";
import { DrizzleAccountRepository } from "../../../accounts/infrastructure/persistence/drizzle-account-repository";
import { DrizzleCategoryRepository } from "../../../categories/infrastructure/persistence/drizzle-category-repository";
import type { AuthVariables } from "../../../../shared/auth-middleware";
import { authMiddleware } from "../../../../shared/auth-middleware";
import { createDb } from "../../../../shared/db";
import type { Bindings } from "../../../../shared/env";
import { createTransaction } from "../../application/create-transaction";
import { deleteTransaction } from "../../application/delete-transaction";
import { listTransactions } from "../../application/list-transactions";
import { updateTransaction } from "../../application/update-transaction";
import { DrizzleTransactionRepository } from "../persistence/drizzle-transaction-repository";

type TransactionBody = {
  accountId?: string;
  categoryId?: string | null;
  amount?: number;
  description?: string | null;
  occurredAt?: string;
};

export const transactionRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

transactionRoutes.use("*", authMiddleware);

transactionRoutes.use("*", async (c, next) => {
  if (!c.get("familyId")) {
    return c.json({ error: "User does not belong to a family yet" }, 400);
  }
  await next();
});

transactionRoutes.get("/", async (c) => {
  const familyId = c.get("familyId") as string;
  const transactionRepository = new DrizzleTransactionRepository(createDb(c.env.DB));

  const transactions = await listTransactions({ transactionRepository }, { familyId });
  return c.json(transactions);
});

transactionRoutes.post("/", async (c) => {
  const familyId = c.get("familyId") as string;
  const userId = c.get("userId");
  const body = await c.req.json<TransactionBody>();
  if (!body.accountId || typeof body.amount !== "number" || !body.occurredAt) {
    return c.json({ error: "accountId, amount and occurredAt are required" }, 400);
  }

  const db = createDb(c.env.DB);
  const transactionRepository = new DrizzleTransactionRepository(db);
  const accountRepository = new DrizzleAccountRepository(db);
  const categoryRepository = new DrizzleCategoryRepository(db);

  try {
    const result = await createTransaction(
      { transactionRepository, accountRepository, categoryRepository },
      {
        familyId,
        accountId: body.accountId,
        categoryId: body.categoryId ?? null,
        createdByUserId: userId,
        amount: body.amount,
        description: body.description ?? null,
        occurredAt: body.occurredAt,
      },
    );
    return c.json(result, 201);
  } catch (err) {
    if (err instanceof Error) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

transactionRoutes.patch("/:id", async (c) => {
  const familyId = c.get("familyId") as string;
  const id = c.req.param("id");
  const body = await c.req.json<TransactionBody>();
  if (Object.keys(body).length === 0) {
    return c.json({ error: "At least one field is required" }, 400);
  }

  const db = createDb(c.env.DB);
  const transactionRepository = new DrizzleTransactionRepository(db);
  const accountRepository = new DrizzleAccountRepository(db);
  const categoryRepository = new DrizzleCategoryRepository(db);

  try {
    const result = await updateTransaction(
      { transactionRepository, accountRepository, categoryRepository },
      { familyId, id, changes: body },
    );
    return c.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Transaction not found") {
      return c.json({ error: err.message }, 404);
    }
    if (err instanceof Error) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

transactionRoutes.delete("/:id", async (c) => {
  const familyId = c.get("familyId") as string;
  const id = c.req.param("id");
  const transactionRepository = new DrizzleTransactionRepository(createDb(c.env.DB));

  try {
    const result = await deleteTransaction({ transactionRepository }, { familyId, id });
    return c.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Transaction not found") {
      return c.json({ error: err.message }, 404);
    }
    throw err;
  }
});
