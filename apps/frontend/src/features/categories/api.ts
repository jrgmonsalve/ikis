import { apiFetch } from "@/lib/api-client";

export type Category = {
  id: string;
  name: string;
  parentId: string | null;
  children: Category[];
};

export function getCategoryTree(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

export function createCategory(input: { name: string; parentId?: string | null }): Promise<Category> {
  return apiFetch<Category>("/categories", { method: "POST", body: input });
}

export function renameCategory(id: string, name: string): Promise<Category> {
  return apiFetch<Category>(`/categories/${id}`, { method: "PATCH", body: { name } });
}

export function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/categories/${id}`, { method: "DELETE" });
}
