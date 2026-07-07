import { Hono } from "hono";
import { DrizzleCategoryRepository } from "../../../categories/infrastructure/persistence/drizzle-category-repository";
import { DrizzleFamilyRepository } from "../../../families/infrastructure/persistence/drizzle-family-repository";
import type { AuthVariables } from "../../../../shared/auth-middleware";
import { authMiddleware } from "../../../../shared/auth-middleware";
import { createDb } from "../../../../shared/db";
import type { Bindings } from "../../../../shared/env";
import { createBudget } from "../../application/create-budget";
import { defineCurrentBudgetCycle } from "../../application/define-current-budget-cycle";
import { getBudgetStatus } from "../../application/get-budget-status";
import { getCurrentCycle } from "../../application/get-current-cycle";
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
  const date = c.req.query("date");
  if (!date) {
    return c.json({ error: "date is required, e.g. ?date=2026-07-28" }, 400);
  }

  const db = createDb(c.env.DB);
  const budgetRepository = new DrizzleBudgetRepository(db);
  const familyRepository = new DrizzleFamilyRepository(db);

  try {
    const status = await getBudgetStatus({ budgetRepository, familyRepository }, { familyId, date });
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
  const body = await c.req.json<{ categoryId?: string; amountLimit?: number }>();
  if (!body.categoryId || typeof body.amountLimit !== "number") {
    return c.json({ error: "categoryId and amountLimit are required" }, 400);
  }

  const db = createDb(c.env.DB);
  const budgetRepository = new DrizzleBudgetRepository(db);
  const categoryRepository = new DrizzleCategoryRepository(db);
  const familyRepository = new DrizzleFamilyRepository(db);

  try {
    const budget = await createBudget(
      { budgetRepository, categoryRepository, familyRepository },
      { familyId, categoryId: body.categoryId, amountLimit: body.amountLimit },
    );
    return c.json(budget, 201);
  } catch (err) {
    if (err instanceof Error) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

budgetRoutes.get("/cycle", async (c) => {
  const familyId = c.get("familyId") as string;

  const db = createDb(c.env.DB);
  const budgetRepository = new DrizzleBudgetRepository(db);
  const familyRepository = new DrizzleFamilyRepository(db);

  try {
    const cycle = await getCurrentCycle({ budgetRepository, familyRepository }, { familyId });
    return c.json(cycle);
  } catch (err) {
    if (err instanceof Error) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

budgetRoutes.put("/cycle", async (c) => {
  const familyId = c.get("familyId") as string;
  const body = await c.req.json<{ start?: string; end?: string }>();
  if (!body.start || !body.end) {
    return c.json({ error: "start and end are required" }, 400);
  }

  const db = createDb(c.env.DB);
  const budgetRepository = new DrizzleBudgetRepository(db);
  const familyRepository = new DrizzleFamilyRepository(db);

  try {
    const cycle = await defineCurrentBudgetCycle(
      { budgetRepository, familyRepository },
      { familyId, start: body.start, end: body.end },
    );
    return c.json(cycle);
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
