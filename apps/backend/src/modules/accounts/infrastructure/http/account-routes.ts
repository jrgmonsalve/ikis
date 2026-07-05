import { Hono } from "hono";
import type { AuthVariables } from "../../../../shared/auth-middleware";
import { authMiddleware } from "../../../../shared/auth-middleware";
import { createDb } from "../../../../shared/db";
import type { Bindings } from "../../../../shared/env";
import type { AccountType } from "../../domain/account";
import { createAccount } from "../../application/create-account";
import { listAccounts } from "../../application/list-accounts";
import { updateAccount } from "../../application/update-account";
import { DrizzleAccountRepository } from "../persistence/drizzle-account-repository";

const ACCOUNT_TYPES = ["checking", "savings", "credit_card", "cash"] as const;

const isValidAccountType = (value: unknown): value is AccountType =>
  typeof value === "string" && (ACCOUNT_TYPES as readonly string[]).includes(value);

export const accountRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

accountRoutes.use("*", authMiddleware);

accountRoutes.use("*", async (c, next) => {
  if (!c.get("familyId")) {
    return c.json({ error: "User does not belong to a family yet" }, 400);
  }
  await next();
});

accountRoutes.get("/", async (c) => {
  const familyId = c.get("familyId") as string;
  const accountRepository = new DrizzleAccountRepository(createDb(c.env.DB));

  const accounts = await listAccounts({ accountRepository }, { familyId });
  return c.json(accounts);
});

accountRoutes.post("/", async (c) => {
  const familyId = c.get("familyId") as string;
  const body = await c.req.json<{ name?: string; type?: string; currency?: string }>();
  if (!body.name || !isValidAccountType(body.type)) {
    return c.json({ error: "name and a valid type are required" }, 400);
  }

  const accountRepository = new DrizzleAccountRepository(createDb(c.env.DB));

  const account = await createAccount(
    { accountRepository },
    { familyId, name: body.name, type: body.type, currency: body.currency },
  );
  return c.json(account, 201);
});

accountRoutes.patch("/:id", async (c) => {
  const familyId = c.get("familyId") as string;
  const id = c.req.param("id");
  const body = await c.req.json<{ name?: string; type?: string }>();
  if (body.type !== undefined && !isValidAccountType(body.type)) {
    return c.json({ error: "type must be one of checking, savings, credit_card, cash" }, 400);
  }
  if (body.name === undefined && body.type === undefined) {
    return c.json({ error: "At least one field is required" }, 400);
  }

  const accountRepository = new DrizzleAccountRepository(createDb(c.env.DB));

  try {
    const account = await updateAccount(
      { accountRepository },
      { familyId, id, changes: { name: body.name, type: body.type } },
    );
    return c.json(account);
  } catch (err) {
    if (err instanceof Error && err.message === "Account not found") {
      return c.json({ error: err.message }, 404);
    }
    throw err;
  }
});
