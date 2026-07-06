import type { FormEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/features/categories/api";
import {
  useCategoryTree,
  useCreateCategory,
  useDeleteCategory,
  useRenameCategory,
} from "@/features/categories/hooks";

type DialogState =
  | { mode: "create-root" }
  | { mode: "create-sub"; parentId: string }
  | { mode: "rename"; category: Category };

export function CategoriesPage() {
  const { t } = useTranslation();
  const { data: categories, isLoading } = useCategoryTree();
  const createCategory = useCreateCategory();
  const renameCategory = useRenameCategory();
  const deleteCategory = useDeleteCategory();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [name, setName] = useState("");

  function openDialog(state: DialogState, initialName = "") {
    setDialog(state);
    setName(initialName);
  }

  function closeDialog() {
    setDialog(null);
    setName("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!dialog || !trimmed) {
      return;
    }

    if (dialog.mode === "create-root") {
      createCategory.mutate({ name: trimmed, parentId: null }, { onSuccess: closeDialog });
    } else if (dialog.mode === "create-sub") {
      createCategory.mutate({ name: trimmed, parentId: dialog.parentId }, { onSuccess: closeDialog });
    } else {
      renameCategory.mutate({ id: dialog.category.id, name: trimmed }, { onSuccess: closeDialog });
    }
  }

  function handleDelete(category: Category) {
    if (window.confirm(t("categories.deleteConfirm", { name: category.name }))) {
      deleteCategory.mutate(category.id);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-medium">{t("categories.title")}</h1>
        <Button onClick={() => openDialog({ mode: "create-root" })}>{t("categories.addRoot")}</Button>
      </div>

      {isLoading && <p className="text-muted-foreground">{t("common.loading")}</p>}
      {!isLoading && categories?.length === 0 && (
        <p className="text-muted-foreground">{t("categories.empty")}</p>
      )}

      <ul className="flex flex-col gap-2">
        {categories?.map((category) => (
          <li key={category.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
              <span className="font-medium">{category.name}</span>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDialog({ mode: "create-sub", parentId: category.id })}
                >
                  {t("categories.addSubcategory")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDialog({ mode: "rename", category }, category.name)}
                >
                  {t("categories.rename")}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(category)}>
                  {t("categories.delete")}
                </Button>
              </div>
            </div>
            {category.children.length > 0 && (
              <ul className="mt-2 flex flex-col gap-2 border-l pl-4">
                {category.children.map((child) => (
                  <li key={child.id} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
                    <span>{child.name}</span>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog({ mode: "rename", category: child }, child.name)}
                      >
                        {t("categories.rename")}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(child)}>
                        {t("categories.delete")}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "rename" ? t("categories.rename") : t("categories.addRoot")}</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category-name">{t("categories.nameLabel")}</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                {t("categories.cancel")}
              </Button>
              <Button type="submit">{t("categories.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
