import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { AccountsSummaryCard } from "@/features/accounts/components/AccountsSummaryCard";
import { useAccounts } from "@/features/accounts/hooks";
import type { CurrentUser } from "@/features/auth/api";
import { BudgetStatusList } from "@/features/budgets/components/BudgetStatusList";
import { useBudgetStatus, useCurrentCycle } from "@/features/budgets/hooks";
import { calculateUnassignedFunds, sumBudgetLimit } from "@/features/budgets/summary";
import { flattenCategories } from "@/features/categories/flatten";
import { useCategoryTree } from "@/features/categories/hooks";
import { RecentTransactionsList } from "@/features/transactions/components/RecentTransactionsList";
import { useTransactions } from "@/features/transactions/hooks";
import { cycleRangeFromDates, daysUntil, formatCycleRange, formatMoney, todayDate } from "@/lib/format";

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const user = useOutletContext<CurrentUser>();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: budgetStatus, isLoading: budgetsLoading } = useBudgetStatus(todayDate());
  const { data: currentCycle } = useCurrentCycle();
  const { data: categories } = useCategoryTree();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();

  const flatCategories = categories ? flattenCategories(categories) : [];
  const categoryName = (id: string) => flatCategories.find((c) => c.id === id)?.label ?? id;

  const cycleRange = currentCycle ? cycleRangeFromDates(currentCycle.start, currentCycle.end) : null;
  const daysLeft = cycleRange ? daysUntil(cycleRange.end) : null;

  const assignableFunds =
    accounts
      ?.filter((account) => account.type !== "credit_card" && account.archivedAt === null)
      .reduce((sum, account) => sum + account.balance, 0) ?? 0;
  const totalBudget = sumBudgetLimit(budgetStatus ?? []);
  const unassigned = calculateUnassignedFunds(assignableFunds, budgetStatus ?? []);
  const showBudgetSummary = accounts !== undefined && budgetStatus !== undefined;

  return (
    <div className="-mx-4 flex flex-col">
      <div
        className="px-4 pt-4 pb-8 text-primary-foreground"
        style={{ background: "linear-gradient(180deg, var(--primary) 0%, var(--hero-gradient-end) 100%)" }}
      >
        <div className="mx-auto flex max-w-lg flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-hero-foreground/70">{t("dashboard.greeting", { name: user.name })}</p>
            {daysLeft !== null && (
              <span className="whitespace-nowrap rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-gold-foreground">
                {t("dashboard.closesIn", { count: daysLeft })}
              </span>
            )}
          </div>

          {cycleRange && (
            <p className="text-xs text-hero-foreground/60">{formatCycleRange(cycleRange.start, cycleRange.end, i18n.language)}</p>
          )}
          {showBudgetSummary && (
            <div className="mt-3 flex flex-col gap-1 text-base font-bold text-hero-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>{t("dashboard.capital")}</span>
                <span className="tabular-nums">{formatMoney(assignableFunds, "COP")}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>{t("dashboard.totalBudget")}</span>
                <span className="tabular-nums">{formatMoney(totalBudget, "COP")}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>{t("dashboard.budgetVsCapital")}</span>
                <span className="tabular-nums">{formatMoney(unassigned, "COP")}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-5">
        <div className="mx-auto flex max-w-lg flex-col gap-6">
          <AccountsSummaryCard accounts={accounts} isLoading={accountsLoading} />
          <BudgetStatusList budgetStatus={budgetStatus} isLoading={budgetsLoading} categoryName={categoryName} />
          <RecentTransactionsList transactions={transactions} isLoading={transactionsLoading} categoryName={categoryName} />
        </div>
      </div>
    </div>
  );
}
