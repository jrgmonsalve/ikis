import { Hono } from "hono";
import type { AuthVariables } from "../../../../shared/auth-middleware";
import { authMiddleware } from "../../../../shared/auth-middleware";
import { createDb } from "../../../../shared/db";
import type { Bindings } from "../../../../shared/env";
import { createCommitment } from "../../application/create-commitment";
import { listCommitments } from "../../application/list-commitments";
import { listUpcomingCommitments } from "../../application/list-upcoming-commitments";
import { markCommitmentPaid } from "../../application/mark-commitment-paid";
import { unmarkCommitmentPaid } from "../../application/unmark-commitment-paid";
import { updateCommitment } from "../../application/update-commitment";
import { DrizzleCommitmentRepository } from "../persistence/drizzle-commitment-repository";

export const commitmentRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

commitmentRoutes.use("*", authMiddleware);

commitmentRoutes.use("*", async (c, next) => {
  if (!c.get("familyId")) {
    return c.json({ error: "User does not belong to a family yet" }, 400);
  }
  await next();
});

commitmentRoutes.get("/", async (c) => {
  const familyId = c.get("familyId") as string;
  const commitmentRepository = new DrizzleCommitmentRepository(createDb(c.env.DB));

  const commitments = await listCommitments({ commitmentRepository }, { familyId });
  return c.json(commitments);
});

commitmentRoutes.get("/upcoming", async (c) => {
  const familyId = c.get("familyId") as string;
  const withinDaysParam = c.req.query("withinDays");
  const withinDays = withinDaysParam === undefined ? undefined : Number(withinDaysParam);
  if (withinDays !== undefined && (!Number.isInteger(withinDays) || withinDays < 0)) {
    return c.json({ error: "withinDays must be a non-negative integer" }, 400);
  }

  const commitmentRepository = new DrizzleCommitmentRepository(createDb(c.env.DB));

  const upcoming = await listUpcomingCommitments({ commitmentRepository }, { familyId, withinDays });
  return c.json(upcoming);
});

commitmentRoutes.post("/", async (c) => {
  const familyId = c.get("familyId") as string;
  const body = await c.req.json<{ name?: string; amountLimit?: number; dueDay?: number; notifyDaysBefore?: number }>();
  if (!body.name || typeof body.amountLimit !== "number" || typeof body.dueDay !== "number") {
    return c.json({ error: "name, amountLimit and dueDay are required" }, 400);
  }

  const commitmentRepository = new DrizzleCommitmentRepository(createDb(c.env.DB));

  try {
    const commitment = await createCommitment(
      { commitmentRepository },
      { familyId, name: body.name, amountLimit: body.amountLimit, dueDay: body.dueDay, notifyDaysBefore: body.notifyDaysBefore },
    );
    return c.json(commitment, 201);
  } catch (err) {
    if (err instanceof Error) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

commitmentRoutes.patch("/:id", async (c) => {
  const familyId = c.get("familyId") as string;
  const id = c.req.param("id");
  const body = await c.req.json<{
    name?: string;
    amountLimit?: number;
    dueDay?: number;
    notifyDaysBefore?: number;
    archived?: boolean;
  }>();
  if (
    body.name === undefined &&
    body.amountLimit === undefined &&
    body.dueDay === undefined &&
    body.notifyDaysBefore === undefined &&
    body.archived === undefined
  ) {
    return c.json({ error: "At least one field is required" }, 400);
  }

  const commitmentRepository = new DrizzleCommitmentRepository(createDb(c.env.DB));

  try {
    const commitment = await updateCommitment(
      { commitmentRepository },
      {
        familyId,
        id,
        changes: {
          name: body.name,
          amountLimit: body.amountLimit,
          dueDay: body.dueDay,
          notifyDaysBefore: body.notifyDaysBefore,
          archivedAt: body.archived === undefined ? undefined : body.archived ? new Date() : null,
        },
      },
    );
    return c.json(commitment);
  } catch (err) {
    if (err instanceof Error && err.message === "Commitment not found") {
      return c.json({ error: err.message }, 404);
    }
    if (err instanceof Error) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

commitmentRoutes.post("/:id/payments", async (c) => {
  const familyId = c.get("familyId") as string;
  const commitmentId = c.req.param("id");
  const body = await c.req.json<{ period?: string }>();
  if (!body.period) {
    return c.json({ error: "period is required, e.g. { \"period\": \"2026-09\" }" }, 400);
  }

  const commitmentRepository = new DrizzleCommitmentRepository(createDb(c.env.DB));

  try {
    const payment = await markCommitmentPaid({ commitmentRepository }, { familyId, commitmentId, period: body.period });
    return c.json(payment, 201);
  } catch (err) {
    if (err instanceof Error && err.message === "Commitment not found") {
      return c.json({ error: err.message }, 404);
    }
    if (err instanceof Error) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

commitmentRoutes.delete("/:id/payments/:period", async (c) => {
  const familyId = c.get("familyId") as string;
  const commitmentId = c.req.param("id");
  const period = c.req.param("period");

  const commitmentRepository = new DrizzleCommitmentRepository(createDb(c.env.DB));

  try {
    await unmarkCommitmentPaid({ commitmentRepository }, { familyId, commitmentId, period });
    return c.body(null, 204);
  } catch (err) {
    if (err instanceof Error && err.message === "Commitment not found") {
      return c.json({ error: err.message }, 404);
    }
    if (err instanceof Error) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});
