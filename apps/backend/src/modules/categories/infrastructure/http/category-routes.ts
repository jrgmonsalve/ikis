import { Hono } from "hono";
import type { AuthVariables } from "../../../../shared/auth-middleware";
import { authMiddleware } from "../../../../shared/auth-middleware";
import { createDb } from "../../../../shared/db";
import type { Bindings } from "../../../../shared/env";
import { createCategory } from "../../application/create-category";
import { deleteCategory } from "../../application/delete-category";
import { listCategoryTree } from "../../application/list-category-tree";
import { renameCategory } from "../../application/rename-category";
import { DrizzleCategoryRepository } from "../persistence/drizzle-category-repository";

export const categoryRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

categoryRoutes.use("*", authMiddleware);

categoryRoutes.use("*", async (c, next) => {
  if (!c.get("familyId")) {
    return c.json({ error: "User does not belong to a family yet" }, 400);
  }
  await next();
});

categoryRoutes.get("/", async (c) => {
  const familyId = c.get("familyId") as string;
  const categoryRepository = new DrizzleCategoryRepository(createDb(c.env.DB));

  const tree = await listCategoryTree({ categoryRepository }, { familyId });
  return c.json(tree);
});

categoryRoutes.post("/", async (c) => {
  const familyId = c.get("familyId") as string;
  const body = await c.req.json<{ name?: string; parentId?: string | null }>();
  if (!body.name) {
    return c.json({ error: "name is required" }, 400);
  }

  const categoryRepository = new DrizzleCategoryRepository(createDb(c.env.DB));

  try {
    const category = await createCategory(
      { categoryRepository },
      { familyId, parentId: body.parentId ?? null, name: body.name },
    );
    return c.json(category, 201);
  } catch (err) {
    if (err instanceof Error) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

categoryRoutes.patch("/:id", async (c) => {
  const familyId = c.get("familyId") as string;
  const id = c.req.param("id");
  const body = await c.req.json<{ name?: string }>();
  if (!body.name) {
    return c.json({ error: "name is required" }, 400);
  }

  const categoryRepository = new DrizzleCategoryRepository(createDb(c.env.DB));

  try {
    const category = await renameCategory({ categoryRepository }, { familyId, id, name: body.name });
    return c.json(category);
  } catch (err) {
    if (err instanceof Error && err.message === "Category not found") {
      return c.json({ error: err.message }, 404);
    }
    throw err;
  }
});

categoryRoutes.delete("/:id", async (c) => {
  const familyId = c.get("familyId") as string;
  const id = c.req.param("id");
  const categoryRepository = new DrizzleCategoryRepository(createDb(c.env.DB));

  try {
    await deleteCategory({ categoryRepository }, { familyId, id });
    return c.body(null, 204);
  } catch (err) {
    if (err instanceof Error && err.message === "Category not found") {
      return c.json({ error: err.message }, 404);
    }
    throw err;
  }
});
