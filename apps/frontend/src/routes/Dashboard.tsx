import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router";
import { useAccounts } from "@/features/accounts/hooks";
import type { CurrentUser } from "@/features/auth/api";
import { useBudgetStatus } from "@/features/budgets/hooks";
import { flattenCategories } from "@/features/categories/flatten";
import { useCategoryTree } from "@/features/categories/hooks";
import { useFamily } from "@/features/family/hooks";
import { useTransactions } from "@/features/transactions/hooks";
import { currentCycleRange, currentPeriod, daysUntil, formatCycleRange, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const user = useOutletContext<CurrentUser>();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: budgetStatus, isLoading: budgetsLoading } = useBudgetStatus(currentPeriod());
  const { data: categories } = useCategoryTree();
  const { data: family } = useFamily();
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

  const cycleRange = family ? currentCycleRange(family.budgetCycleStartDay) : null;
  const daysLeft = cycleRange ? daysUntil(cycleRange.end) : null;

  const recentTransactions = [...(transactions ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);

  return (
    <div className="-mx-4 flex flex-col">
      <div
        className="px-4 pt-8 pb-8 text-primary-foreground"
        style={{ background: "linear-gradient(180deg, var(--primary) 0%, #241F6B 100%)" }}
      >
        <div className="mx-auto flex max-w-lg flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-primary-foreground/70">{t("dashboard.greeting", { name: user.name })}</p>
            {daysLeft !== null && (
              <span className="whitespace-nowrap rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-gold-foreground">
                {t("dashboard.closesIn", { count: daysLeft })}
              </span>
            )}
          </div>
          <p className="text-xs tracking-wide text-primary-foreground/60 uppercase">{t("dashboard.balanceLabel")}</p>
          <p className="font-heading text-4xl font-semibold tabular-nums">{formatMoney(totalBalance, "COP")}</p>
          {cycleRange && (
            <p className="text-xs text-primary-foreground/60">{formatCycleRange(cycleRange.start, cycleRange.end, i18n.language)}</p>
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
                <div className="relative size-24 rounded-full" style={{ background: `conic-gradient(${donutGradient})` }}>
                  <div className="absolute inset-[13px] flex flex-col items-center justify-center rounded-full bg-card">
                    <span className="text-[9px] tracking-wide text-muted-foreground uppercase">{t("dashboard.total")}</span>
                    <span className="text-xs font-bold tabular-nums">{formatMoney(totalBalance, "COP")}</span>
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
              {budgetStatus?.map((budget) => (
                <li key={budget.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                  <span>{categoryName(budget.categoryId)}</span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(budget.spent, "COP")} / {formatMoney(budget.amountLimit, "COP")}
                  </span>
                </li>
              ))}
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
