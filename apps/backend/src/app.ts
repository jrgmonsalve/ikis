import { Hono } from "hono";
import type { Bindings } from "./shared/env";

export const createApp = () => {
  const app = new Hono<{ Bindings: Bindings }>();

  app.get("/health", (c) => c.json({ status: "ok" }));

  return app;
};
