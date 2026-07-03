import { Hono } from "hono";
import { authRoutes } from "./modules/auth/infrastructure/http/auth-routes";
import type { Bindings } from "./shared/env";

export const createApp = () => {
  const app = new Hono<{ Bindings: Bindings }>();

  app.get("/health", (c) => c.json({ status: "ok" }));
  app.route("/auth", authRoutes);

  return app;
};
