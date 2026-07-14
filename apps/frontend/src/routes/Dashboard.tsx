import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router";
import { Progress } from "@/components/ui/progress";
import { useAccounts } from "@/features/accounts/hooks";
import type { CurrentUser } from "@/features/auth/api";
import { useBudgetStatus, useCurrentCycle } from "@/features/budgets/hooks";
import { calculateUnassignedFunds, sortBudgetStatusByExecution } from "@/features/budgets/summary";
import { flattenCategories } from "@/features/categories/flatten";
import { useCategoryTree } from "@/features/categories/hooks";
import { useTransactions } from "@/features/transactions/hooks";
import { cycleRangeFromDates, daysUntil, formatCycleRange, formatMoney, todayDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#e11d48", "#16a34a", "#eab308", "#2563eb", "#f97316", "#0d9488", "#9333ea"];

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

  const totalBalance = accounts?.reduce((sum, account) => sum + account.balance, 0) ?? 0;
  const totalForChart = accounts?.reduce((sum, account) => sum + Math.max(account.balance, 0), 0) ?? 0;

  let cumulative = 0;
  const slices = (accounts ?? []).map((account, index) => {
    const value = Math.max(account.balance, 0);
    const pct = totalForChart > 0 ? (value / totalForChart) * 100 : 0;
    const start = cumulative;
    cumulative += pct;
    return { account, pct, start, end: cumulative, color: CHART_COLORS[index % CHART_COLORS.length] };
  });
  const donutGradient =
    totalForChart > 0 ? slices.map((slice) => `${slice.color} ${slice.start}% ${slice.end}%`).join(", ") : "var(--muted) 0% 100%";

  const cycleRange = currentCycle ? cycleRangeFromDates(currentCycle.start, currentCycle.end) : null;
  const daysLeft = cycleRange ? daysUntil(cycleRange.end) : null;

  const assignableFunds =
    accounts
      ?.filter((account) => account.type !== "credit_card" && account.archivedAt === null)
      .reduce((sum, account) => sum + account.balance, 0) ?? 0;
  const unassigned = calculateUnassignedFunds(assignableFunds, budgetStatus ?? []);
  const showBudgetSummary = accounts !== undefined && budgetStatus !== undefined;
  const orderedBudgetStatus = budgetStatus ? sortBudgetStatusByExecution(budgetStatus) : [];

  const recentTransactions = [...(transactions ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);

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
                <span>{t("dashboard.budgetVsCapital")}</span>
                <span className="tabular-nums">{formatMoney(unassigned, "COP")}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-5">
        <div className="mx-auto flex max-w-lg flex-col gap-6">
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("dashboard.accounts")}</h2>
              <Link to="/accounts" className="text-sm font-medium text-primary">
                {t("dashboard.viewAll")}
              </Link>
            </div>
            {accountsLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
            {!accountsLoading && accounts?.length === 0 && <p className="text-sm text-muted-foreground">{t("accounts.empty")}</p>}
            {!accountsLoading && accounts && accounts.length > 0 && (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="relative size-40 rounded-full" style={{ background: `conic-gradient(${donutGradient})` }}>
                  <div className="absolute inset-[22px] flex flex-col items-center justify-center rounded-full bg-card">
                    <span className="text-[10px] tracking-wide text-muted-foreground uppercase">{t("dashboard.total")}</span>
                    <span className="text-sm font-bold tabular-nums">{formatMoney(totalBalance, "COP")}</span>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2.5">
                  {slices.map(({ account, pct, color }) => (
                    <div key={account.id} className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 shrink-0 rounded-sm" style={{ background: color }} />
                      <span className="flex-1">{account.name}</span>
                      <span className="font-medium tabular-nums">{formatMoney(account.balance, account.currency)}</span>
                      <span className="w-9 text-right text-xs text-muted-foreground">{Math.round(pct)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("dashboard.budgetThisMonth")}
              </h2>
              <Link to="/budgets" className="text-sm font-medium text-primary">
                {t("dashboard.viewAll")}
              </Link>
            </div>
            {budgetsLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
            {!budgetsLoading && budgetStatus?.length === 0 && <p className="text-sm text-muted-foreground">{t("budgets.empty")}</p>}
            <ul className="flex flex-col gap-2">
              {orderedBudgetStatus.map((budget) => {
                const percent = Math.min(100, Math.round((budget.spent / budget.amountLimit) * 100));
                return (
                  <li key={budget.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span>{categoryName(budget.categoryId)}</span>
                      <span className="font-medium tabular-nums">
                        {formatMoney(budget.spent, "COP")} / {formatMoney(budget.amountLimit, "COP")}
                      </span>
                    </div>
                    <Progress value={percent} className="[&_[data-slot=progress-track]]:h-5">
                      <span
                        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-clip-text text-base leading-none font-bold text-transparent"
                        style={{
                          backgroundImage: `linear-gradient(to right, #fff 0%, #fff ${percent}%, var(--foreground) ${percent}%, var(--foreground) 100%)`,
                        }}
                      >
                        {percent}%
                      </span>
                    </Progress>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("dashboard.recentTransactions")}
              </h2>
              <Link to="/transactions" className="text-sm font-medium text-primary">
                {t("dashboard.viewAll")}
              </Link>
            </div>
            {transactionsLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
            {!transactionsLoading && recentTransactions.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("movements.emptyTransactions")}</p>
            )}
            {recentTransactions.length > 0 && (
              <ul className="flex flex-col rounded-2xl border border-border bg-card">
                {recentTransactions.map((transaction) => {
                  const isIncome = transaction.amount > 0;
                  return (
                    <li key={transaction.id} className="flex items-center gap-3 border-b border-border p-3 last:border-b-0">
                      <span
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg",
                          isIncome ? "bg-gold-soft text-gold" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isIncome ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {transaction.description ||
                            (transaction.categoryId
                              ? categoryName(transaction.categoryId)
                              : t(isIncome ? "movements.income" : "movements.expense"))}
                        </p>
                        <p className="text-xs text-muted-foreground">{transaction.occurredAt}</p>
                      </div>
                      <span className={cn("text-sm font-semibold tabular-nums", isIncome && "text-primary")}>
                        {formatMoney(transaction.amount, "COP")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
