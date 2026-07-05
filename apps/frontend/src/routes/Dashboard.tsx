import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router";
import { AddMovementDialog } from "@/components/AddMovementDialog";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/features/accounts/hooks";
import type { CurrentUser } from "@/features/auth/api";
import { useBudgetStatus } from "@/features/budgets/hooks";
import { flattenCategories } from "@/features/categories/flatten";
import { useCategoryTree } from "@/features/categories/hooks";
import { currentPeriod, formatMoney } from "@/lib/format";

export function Dashboard() {
  const { t } = useTranslation();
  const user = useOutletContext<CurrentUser>();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: budgetStatus, isLoading: budgetsLoading } = useBudgetStatus(currentPeriod());
  const { data: categories } = useCategoryTree();
  const [addOpen, setAddOpen] = useState(false);

  const flatCategories = categories ? flattenCategories(categories) : [];
  const categoryName = (id: string) => flatCategories.find((c) => c.id === id)?.label ?? id;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-medium">{t("dashboard.greeting", { name: user.name })}</h1>
        <Button onClick={() => setAddOpen(true)}>{t("movements.add")}</Button>
      </div>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-muted-foreground">{t("dashboard.accounts")}</h2>
          <Link to="/accounts" className="text-sm underline">
            {t("dashboard.viewAll")}
          </Link>
        </div>
        {accountsLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
        {!accountsLoading && accounts?.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("accounts.empty")}</p>
        )}
        <ul className="flex flex-col gap-2">
          {accounts?.map((account) => (
            <li key={account.id} className="flex items-center justify-between rounded-lg border p-3">
              <span>{account.name}</span>
              <span className="font-medium tabular-nums">{formatMoney(account.balance, account.currency)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-muted-foreground">{t("dashboard.budgetThisMonth")}</h2>
          <Link to="/budgets" className="text-sm underline">
            {t("dashboard.viewAll")}
          </Link>
        </div>
        {budgetsLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
        {!budgetsLoading && budgetStatus?.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("budgets.empty")}</p>
        )}
        <ul className="flex flex-col gap-2">
          {budgetStatus?.map((budget) => (
            <li key={budget.id} className="flex items-center justify-between rounded-lg border p-3">
              <span>{categoryName(budget.categoryId)}</span>
              <span className="font-medium tabular-nums">
                {formatMoney(budget.spent, "COP")} / {formatMoney(budget.amountLimit, "COP")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <AddMovementDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
