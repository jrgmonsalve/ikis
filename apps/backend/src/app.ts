import { Hono } from "hono";
import { cors } from "hono/cors";
import { accountRoutes } from "./modules/accounts/infrastructure/http/account-routes";
import { authRoutes } from "./modules/auth/infrastructure/http/auth-routes";
import { categoryRoutes } from "./modules/categories/infrastructure/http/category-routes";
import { familyRoutes } from "./modules/families/infrastructure/http/family-routes";
import { transactionRoutes } from "./modules/transactions/infrastructure/http/transaction-routes";
import { transferRoutes } from "./modules/transfers/infrastructure/http/transfer-routes";
import { userRoutes } from "./modules/users/infrastructure/http/user-routes";
import type { Bindings } from "./shared/env";

export const createApp = () => {
  const app = new Hono<{ Bindings: Bindings }>();

  app.use(
    "*",
    cors({
      origin: (origin, c) => (origin === c.env.ALLOWED_ORIGIN ? origin : undefined),
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PATCH", "DELETE"],
    }),
  );

  app.get("/health", (c) => c.json({ status: "ok" }));

  const v1 = new Hono<{ Bindings: Bindings }>();
  v1.route("/auth", authRoutes);
  v1.route("/", userRoutes);
  v1.route("/families", familyRoutes);
  v1.route("/categories", categoryRoutes);
  v1.route("/accounts", accountRoutes);
  v1.route("/transactions", transactionRoutes);
  v1.route("/transfers", transferRoutes);
  app.route("/api/v1", v1);

  return app;
};
