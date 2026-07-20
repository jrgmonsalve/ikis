import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { Account } from "@/features/accounts/api";
import { buildAccountDonutChart } from "@/features/accounts/donut";
import { formatMoney } from "@/lib/format";

type AccountsSummaryCardProps = {
  accounts: Account[] | undefined;
  isLoading: boolean;
};

export function AccountsSummaryCard({ accounts, isLoading }: AccountsSummaryCardProps) {
  const { t } = useTranslation();
  const { totalBalance, slices, gradient } = buildAccountDonutChart(accounts ?? []);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("dashboard.accounts")}</h2>
        <Link to="/accounts" className="text-sm font-medium text-primary">
          {t("dashboard.viewAll")}
        </Link>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
      {!isLoading && accounts?.length === 0 && <p className="text-sm text-muted-foreground">{t("accounts.empty")}</p>}
      {!isLoading && accounts && accounts.length > 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="relative size-40 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
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
  );
}
