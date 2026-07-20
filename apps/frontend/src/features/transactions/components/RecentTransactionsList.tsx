import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { Transaction } from "@/features/transactions/api";
import { selectRecentTransactions } from "@/features/transactions/recent";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type RecentTransactionsListProps = {
  transactions: Transaction[] | undefined;
  isLoading: boolean;
  categoryName: (id: string) => string;
};

export function RecentTransactionsList({ transactions, isLoading, categoryName }: RecentTransactionsListProps) {
  const { t } = useTranslation();
  const recentTransactions = selectRecentTransactions(transactions ?? []);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("dashboard.recentTransactions")}</h2>
        <Link to="/transactions" className="text-sm font-medium text-primary">
          {t("dashboard.viewAll")}
        </Link>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
      {!isLoading && recentTransactions.length === 0 && (
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
                      (transaction.categoryId ? categoryName(transaction.categoryId) : t(isIncome ? "movements.income" : "movements.expense"))}
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
  );
}
