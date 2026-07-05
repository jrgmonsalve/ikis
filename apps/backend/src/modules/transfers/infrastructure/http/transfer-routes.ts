import { Hono } from "hono";
import { DrizzleAccountRepository } from "../../../accounts/infrastructure/persistence/drizzle-account-repository";
import type { AuthVariables } from "../../../../shared/auth-middleware";
import { authMiddleware } from "../../../../shared/auth-middleware";
import { createDb } from "../../../../shared/db";
import type { Bindings } from "../../../../shared/env";
import { createTransfer } from "../../application/create-transfer";
import { deleteTransfer } from "../../application/delete-transfer";
import { listTransfers } from "../../application/list-transfers";
import { updateTransfer } from "../../application/update-transfer";
import { DrizzleTransferRepository } from "../persistence/drizzle-transfer-repository";

type TransferBody = {
  fromAccountId?: string;
  toAccountId?: string;
  amount?: number;
  description?: string | null;
  occurredAt?: string;
};

export const transferRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

transferRoutes.use("*", authMiddleware);

transferRoutes.use("*", async (c, next) => {
  if (!c.get("familyId")) {
    return c.json({ error: "User does not belong to a family yet" }, 400);
  }
  await next();
});

transferRoutes.get("/", async (c) => {
  const familyId = c.get("familyId") as string;
  const transferRepository = new DrizzleTransferRepository(createDb(c.env.DB));

  const transfers = await listTransfers({ transferRepository }, { familyId });
  return c.json(transfers);
});

transferRoutes.post("/", async (c) => {
  const familyId = c.get("familyId") as string;
  const userId = c.get("userId");
  const body = await c.req.json<TransferBody>();
  if (!body.fromAccountId || !body.toAccountId || typeof body.amount !== "number" || !body.occurredAt) {
    return c.json({ error: "fromAccountId, toAccountId, amount and occurredAt are required" }, 400);
  }

  const db = createDb(c.env.DB);
  const transferRepository = new DrizzleTransferRepository(db);
  const accountRepository = new DrizzleAccountRepository(db);

  try {
    const result = await createTransfer(
      { transferRepository, accountRepository },
      {
        familyId,
        fromAccountId: body.fromAccountId,
        toAccountId: body.toAccountId,
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

transferRoutes.patch("/:id", async (c) => {
  const familyId = c.get("familyId") as string;
  const id = c.req.param("id");
  const body = await c.req.json<TransferBody>();
  if (Object.keys(body).length === 0) {
    return c.json({ error: "At least one field is required" }, 400);
  }

  const db = createDb(c.env.DB);
  const transferRepository = new DrizzleTransferRepository(db);
  const accountRepository = new DrizzleAccountRepository(db);

  try {
    const result = await updateTransfer({ transferRepository, accountRepository }, { familyId, id, changes: body });
    return c.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Transfer not found") {
      return c.json({ error: err.message }, 404);
    }
    if (err instanceof Error) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

transferRoutes.delete("/:id", async (c) => {
  const familyId = c.get("familyId") as string;
  const id = c.req.param("id");
  const transferRepository = new DrizzleTransferRepository(createDb(c.env.DB));

  try {
    const result = await deleteTransfer({ transferRepository }, { familyId, id });
    return c.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Transfer not found") {
      return c.json({ error: err.message }, 404);
    }
    throw err;
  }
});
