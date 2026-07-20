import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Progress } from "@/components/ui/progress";
import type { BudgetStatus } from "@/features/budgets/api";
import { sortBudgetStatusByExecution } from "@/features/budgets/summary";
import { formatMoney } from "@/lib/format";

type BudgetStatusListProps = {
  budgetStatus: BudgetStatus[] | undefined;
  isLoading: boolean;
  categoryName: (id: string) => string;
};

export function BudgetStatusList({ budgetStatus, isLoading, categoryName }: BudgetStatusListProps) {
  const { t } = useTranslation();
  const orderedBudgetStatus = budgetStatus ? sortBudgetStatusByExecution(budgetStatus) : [];

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("dashboard.budgetThisMonth")}</h2>
        <Link to="/budgets" className="text-sm font-medium text-primary">
          {t("dashboard.viewAll")}
        </Link>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
      {!isLoading && budgetStatus?.length === 0 && <p className="text-sm text-muted-foreground">{t("budgets.empty")}</p>}
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
  );
}
