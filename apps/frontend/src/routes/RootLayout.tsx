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
        <Link to="/" className="font-heading text-lg font-medium">
          ikis
        </Link>
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
