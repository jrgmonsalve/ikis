import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { UpcomingCommitment } from "@/features/commitments/api";
import { useMarkCommitmentPaid } from "@/features/commitments/hooks";
import { formatMoney } from "@/lib/format";

type UpcomingCommitmentsCardProps = {
  commitments: UpcomingCommitment[] | undefined;
  isLoading: boolean;
};

function dueLabel(daysUntil: number, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (daysUntil < 0) {
    return t("commitments.overdue", { count: -daysUntil });
  }
  if (daysUntil === 0) {
    return t("commitments.dueToday");
  }
  return t("commitments.dueInDays", { count: daysUntil });
}

export function UpcomingCommitmentsCard({ commitments, isLoading }: UpcomingCommitmentsCardProps) {
  const { t } = useTranslation();
  const markPaid = useMarkCommitmentPaid();

  if (!isLoading && commitments?.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("commitments.upcomingTitle")}</h2>
        <Link to="/commitments" className="text-sm font-medium text-primary">
          {t("dashboard.viewAll")}
        </Link>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
      <ul className="flex flex-col gap-2">
        {commitments?.map((commitment) => (
          <li
            key={commitment.id}
            className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
              commitment.daysUntil < 0 ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"
            }`}
          >
            <div>
              <p className="font-medium">{commitment.name}</p>
              <p className={`text-sm ${commitment.daysUntil < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {dueLabel(commitment.daysUntil, t)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium tabular-nums">{formatMoney(commitment.amountLimit, "COP")}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={markPaid.isPending}
                onClick={() => markPaid.mutate({ id: commitment.id, period: commitment.period })}
              >
                {t("commitments.markPaid")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
