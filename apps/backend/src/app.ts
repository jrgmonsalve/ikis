import { Hono } from "hono";
import { authRoutes } from "./modules/auth/infrastructure/http/auth-routes";
import { categoryRoutes } from "./modules/categories/infrastructure/http/category-routes";
import { familyRoutes } from "./modules/families/infrastructure/http/family-routes";
import { userRoutes } from "./modules/users/infrastructure/http/user-routes";
import type { Bindings } from "./shared/env";

export const createApp = () => {
  const app = new Hono<{ Bindings: Bindings }>();

  app.get("/health", (c) => c.json({ status: "ok" }));
  app.route("/auth", authRoutes);
  app.route("/", userRoutes);
  app.route("/families", familyRoutes);
  app.route("/categories", categoryRoutes);

  return app;
};
