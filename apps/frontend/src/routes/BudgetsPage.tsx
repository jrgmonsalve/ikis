import type { FormEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBudgetStatus, useCreateBudget, useUpdateBudget } from "@/features/budgets/hooks";
import { flattenCategories } from "@/features/categories/flatten";
import { useCategoryTree } from "@/features/categories/hooks";
import { currentPeriod, formatMoney } from "@/lib/format";

type DialogState = { mode: "create" } | { mode: "edit"; id: string; amountLimit: number };

export function BudgetsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState(currentPeriod());
  const { data: status, isLoading } = useBudgetStatus(period);
  const { data: categories } = useCategoryTree();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [amountLimit, setAmountLimit] = useState("");

  const flatCategories = categories ? flattenCategories(categories) : [];
  const categoryName = (id: string) => flatCategories.find((c) => c.id === id)?.label ?? id;
  const budgetedCategoryIds = new Set(status?.map((b) => b.categoryId));
  const availableCategories = flatCategories.filter((c) => !budgetedCategoryIds.has(c.id));

  function openCreate() {
    setDialog({ mode: "create" });
    setCategoryId("");
    setAmountLimit("");
  }

  function openEdit(id: string, current: number) {
    setDialog({ mode: "edit", id, amountLimit: current });
    setAmountLimit(String(current));
  }

  function close() {
    setDialog(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = Number(amountLimit);
    if (!dialog || !amount || amount <= 0) {
      return;
    }

    if (dialog.mode === "create") {
      if (!categoryId) {
        return;
      }
      createBudget.mutate({ categoryId, period, amountLimit: amount }, { onSuccess: close });
    } else {
      updateBudget.mutate({ id: dialog.id, amountLimit: amount }, { onSuccess: close });
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-medium">{t("budgets.title")}</h1>
        <Button onClick={openCreate}>{t("budgets.add")}</Button>
      </div>

      <Input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="w-fit" />

      {isLoading && <p className="text-muted-foreground">{t("common.loading")}</p>}
      {!isLoading && status?.length === 0 && <p className="text-muted-foreground">{t("budgets.empty")}</p>}

      <ul className="flex flex-col gap-3">
        {status?.map((budget) => {
          const percent = Math.min(100, Math.round((budget.spent / budget.amountLimit) * 100));
          const overBudget = budget.spent > budget.amountLimit;
          return (
            <li key={budget.id} className="flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{categoryName(budget.categoryId)}</span>
                <Button variant="ghost" size="sm" onClick={() => openEdit(budget.id, budget.amountLimit)}>
                  {t("categories.rename")}
                </Button>
              </div>
              <Progress value={percent} className={overBudget ? "[&_[data-slot=progress-indicator]]:bg-destructive" : ""} />
              <p className={`text-sm ${overBudget ? "text-destructive" : "text-muted-foreground"}`}>
                {formatMoney(budget.spent, "COP")} / {formatMoney(budget.amountLimit, "COP")}
              </p>
            </li>
          );
        })}
      </ul>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? t("budgets.edit") : t("budgets.add")}</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {dialog?.mode === "create" && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("budgets.categoryLabel")}</Label>
                <Select value={categoryId} onValueChange={(value) => setCategoryId(value ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("movements.selectCategory")}>
                      {(value: string) => flatCategories.find((category) => category.id === value)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget-amount">{t("budgets.amountLabel")}</Label>
              <Input
                id="budget-amount"
                type="number"
                step="1"
                min="0"
                value={amountLimit}
                onChange={(event) => setAmountLimit(event.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
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
