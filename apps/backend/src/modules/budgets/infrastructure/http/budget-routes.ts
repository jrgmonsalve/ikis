import { Hono } from "hono";
import { DrizzleCategoryRepository } from "../../../categories/infrastructure/persistence/drizzle-category-repository";
import type { AuthVariables } from "../../../../shared/auth-middleware";
import { authMiddleware } from "../../../../shared/auth-middleware";
import { createDb } from "../../../../shared/db";
import type { Bindings } from "../../../../shared/env";
import { createBudget } from "../../application/create-budget";
import { getBudgetStatus } from "../../application/get-budget-status";
import { updateBudget } from "../../application/update-budget";
import { DrizzleBudgetRepository } from "../persistence/drizzle-budget-repository";

export const budgetRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

budgetRoutes.use("*", authMiddleware);

budgetRoutes.use("*", async (c, next) => {
  if (!c.get("familyId")) {
    return c.json({ error: "User does not belong to a family yet" }, 400);
  }
  await next();
});

budgetRoutes.get("/", async (c) => {
  const familyId = c.get("familyId") as string;
  const period = c.req.query("period");
  if (!period) {
    return c.json({ error: "period is required, e.g. ?period=2026-07" }, 400);
  }

  const budgetRepository = new DrizzleBudgetRepository(createDb(c.env.DB));

  try {
    const status = await getBudgetStatus({ budgetRepository }, { familyId, period });
    return c.json(status);
  } catch (err) {
    if (err instanceof Error) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

budgetRoutes.post("/", async (c) => {
  const familyId = c.get("familyId") as string;
  const body = await c.req.json<{ categoryId?: string; period?: string; amountLimit?: number }>();
  if (!body.categoryId || !body.period || typeof body.amountLimit !== "number") {
    return c.json({ error: "categoryId, period and amountLimit are required" }, 400);
  }

  const db = createDb(c.env.DB);
  const budgetRepository = new DrizzleBudgetRepository(db);
  const categoryRepository = new DrizzleCategoryRepository(db);

  try {
    const budget = await createBudget(
      { budgetRepository, categoryRepository },
      { familyId, categoryId: body.categoryId, period: body.period, amountLimit: body.amountLimit },
    );
    return c.json(budget, 201);
  } catch (err) {
    if (err instanceof Error) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

budgetRoutes.patch("/:id", async (c) => {
  const familyId = c.get("familyId") as string;
  const id = c.req.param("id");
  const body = await c.req.json<{ amountLimit?: number }>();
  if (body.amountLimit === undefined) {
    return c.json({ error: "amountLimit is required" }, 400);
  }

  const budgetRepository = new DrizzleBudgetRepository(createDb(c.env.DB));

  try {
    const budget = await updateBudget({ budgetRepository }, { familyId, id, changes: { amountLimit: body.amountLimit } });
    return c.json(budget);
  } catch (err) {
    if (err instanceof Error && err.message === "Budget not found") {
      return c.json({ error: err.message }, 404);
    }
    if (err instanceof Error) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});
