import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentCycle, useDefineBudgetCycle } from "@/features/budgets/hooks";

const LANGUAGES = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
];

function BudgetCycleSetting() {
  const { t } = useTranslation();
  const { data: currentCycle } = useCurrentCycle();
  const defineCycle = useDefineBudgetCycle();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentCycle) {
      setStart(currentCycle.start);
      setEnd(currentCycle.end);
    }
  }, [currentCycle?.start, currentCycle?.end]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!start || !end) {
      return;
    }
    defineCycle.mutate(
      { start, end },
      { onError: (err) => setError(err instanceof Error ? err.message : t("settings.cycleError")) },
    );
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cycle-start">{t("settings.cycleStartLabel")}</Label>
        <Input id="cycle-start" type="date" value={start} onChange={(event) => setStart(event.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cycle-end">{t("settings.cycleEndLabel")}</Label>
        <Input id="cycle-end" type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
      </div>
      <p className="text-sm text-muted-foreground">{t("settings.cycleHelp")}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={defineCycle.isPending || !start || !end}>
        {t("settings.saveCycle")}
      </Button>
      {defineCycle.isSuccess && !defineCycle.isPending && !error && (
        <p className="text-sm text-muted-foreground">{t("settings.cycleSaved")}</p>
      )}
    </form>
  );
}

function LanguageSetting() {
  const { t, i18n } = useTranslation();
  const current = LANGUAGES.find((language) => i18n.language.startsWith(language.code))?.code ?? "es";

  return (
    <div className="flex items-center justify-between gap-2">
      <Label>{t("settings.language")}</Label>
      <Select value={current} onValueChange={(code) => code && i18n.changeLanguage(code)}>
        <SelectTrigger className="w-36">
          <SelectValue>{(code: string) => LANGUAGES.find((language) => language.code === code)?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              {language.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="font-heading text-2xl font-medium">{t("settings.title")}</h1>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("settings.budgetSection")}</h2>
        <BudgetCycleSetting />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("settings.appSection")}</h2>
        <LanguageSetting />
      </section>
    </div>
  );
}
