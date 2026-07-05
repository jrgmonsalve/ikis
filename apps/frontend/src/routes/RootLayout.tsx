import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useNavigate, useOutletContext } from "react-router";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/features/auth/api";
import { clearToken } from "@/lib/auth-storage";

export function RootLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useOutletContext<CurrentUser>();

  function handleLogout() {
    clearToken();
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-heading text-lg font-medium">
            ikis
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/accounts">{t("nav.accounts")}</Link>
            <Link to="/transactions">{t("nav.transactions")}</Link>
            <Link to="/budgets">{t("nav.budgets")}</Link>
            <Link to="/categories">{t("nav.categories")}</Link>
          </nav>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          {t("common.logout")}
        </Button>
      </header>
      <main className="flex-1 p-4">
        <Outlet context={user} />
      </main>
    </div>
  );
}
