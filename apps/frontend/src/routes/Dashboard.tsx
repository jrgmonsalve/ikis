import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router";
import { buttonVariants } from "@/components/ui/button";
import type { CurrentUser } from "@/features/auth/api";

export function Dashboard() {
  const { t } = useTranslation();
  const user = useOutletContext<CurrentUser>();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="font-heading text-2xl font-medium">{t("dashboard.greeting", { name: user.name })}</h1>
      <Link to="/categories" className={buttonVariants({ className: "w-fit" })}>
        {t("dashboard.goToCategories")}
      </Link>
    </div>
  );
}
