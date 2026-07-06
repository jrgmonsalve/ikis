import { useQueryClient } from "@tanstack/react-query";
import { Home, LogOut, PieChart, Plus, Settings, Tags, Wallet } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useNavigate, useOutletContext } from "react-router";
import { AddMovementDialog } from "@/components/AddMovementDialog";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/features/auth/api";
import { clearToken } from "@/lib/auth-storage";
import { cn } from "@/lib/utils";

function TabLink({
  to,
  end,
  icon: Icon,
  label,
}: {
  to: string;
  end?: boolean;
  icon: typeof Home;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn("flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground", isActive && "text-primary")
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="size-5" strokeWidth={1.8} />
          <span className="text-[11px] font-medium">{label}</span>
          <span className={cn("size-1 rounded-full", isActive ? "bg-gold" : "bg-transparent")} />
        </>
      )}
    </NavLink>
  );
}

export function RootLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useOutletContext<CurrentUser>();
  const [addOpen, setAddOpen] = useState(false);

  function handleLogout() {
    clearToken();
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between px-4">
        <Link to="/" className="font-heading text-lg font-semibold text-primary">
          ikis
        </Link>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} aria-label={t("settings.title")}>
            <Settings className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label={t("common.logout")}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28">
        <Outlet context={user} />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
          <TabLink to="/" end icon={Home} label={t("nav.home")} />
          <TabLink to="/accounts" icon={Wallet} label={t("nav.accounts")} />
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            aria-label={t("movements.add")}
            className="-mt-6 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:translate-y-px"
          >
            <Plus className="size-5" />
          </button>
          <TabLink to="/budgets" icon={PieChart} label={t("nav.budgets")} />
          <TabLink to="/categories" icon={Tags} label={t("nav.categories")} />
        </div>
      </nav>

      <AddMovementDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
