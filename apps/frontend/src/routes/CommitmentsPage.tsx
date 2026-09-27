import type { FormEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import type { Commitment } from "@/features/commitments/api";
import { useCommitments, useCreateCommitment, useUpdateCommitment } from "@/features/commitments/hooks";
import { formatMoney } from "@/lib/format";

type DialogState = { mode: "create" } | { mode: "edit"; commitment: Commitment };

export function CommitmentsPage() {
  const { t } = useTranslation();
  const { data: commitments, isLoading } = useCommitments();
  const createCommitment = useCreateCommitment();
  const updateCommitment = useUpdateCommitment();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [name, setName] = useState("");
  const [amountLimit, setAmountLimit] = useState<number | undefined>(undefined);
  const [dueDay, setDueDay] = useState("");

  function openCreate() {
    setDialog({ mode: "create" });
    setName("");
    setAmountLimit(undefined);
    setDueDay("");
  }

  function openEdit(commitment: Commitment) {
    setDialog({ mode: "edit", commitment });
    setName(commitment.name);
    setAmountLimit(commitment.amountLimit);
    setDueDay(String(commitment.dueDay));
  }

  function close() {
    setDialog(null);
  }

  function toggleArchived(commitment: Commitment) {
    updateCommitment.mutate({ id: commitment.id, changes: { archived: commitment.archivedAt === null } }, { onSuccess: close });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const day = Number(dueDay);
    if (!name.trim() || !amountLimit || amountLimit <= 0 || !dueDay || day < 1 || day > 31) {
      return;
    }

    if (dialog?.mode === "create") {
      createCommitment.mutate({ name: name.trim(), amountLimit, dueDay: day }, { onSuccess: close });
    } else if (dialog?.mode === "edit") {
      updateCommitment.mutate({ id: dialog.commitment.id, changes: { name: name.trim(), amountLimit, dueDay: day } }, { onSuccess: close });
    }
  }

  const activeCommitments = commitments?.filter((commitment) => commitment.archivedAt === null) ?? [];
  const archivedCommitments = commitments?.filter((commitment) => commitment.archivedAt !== null) ?? [];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-medium">{t("commitments.title")}</h1>
        <Button onClick={openCreate}>{t("commitments.add")}</Button>
      </div>

      {isLoading && <p className="text-muted-foreground">{t("common.loading")}</p>}
      {!isLoading && commitments?.length === 0 && <p className="text-muted-foreground">{t("commitments.empty")}</p>}

      <ul className="flex flex-col gap-2">
        {activeCommitments.map((commitment) => (
          <li key={commitment.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <div>
              <p className="font-medium">{commitment.name}</p>
              <p className="text-sm text-muted-foreground">{t("commitments.dueDayLabel", { day: commitment.dueDay })}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium tabular-nums">{formatMoney(commitment.amountLimit, "COP")}</span>
              <Button variant="ghost" size="sm" onClick={() => openEdit(commitment)}>
                {t("commitments.edit")}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {archivedCommitments.length > 0 && (
        <ul className="flex flex-col gap-2 opacity-60">
          {archivedCommitments.map((commitment) => (
            <li key={commitment.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div>
                <p className="font-medium">
                  {commitment.name}
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                    {t("commitments.archivedBadge")}
                  </span>
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => openEdit(commitment)}>
                {t("commitments.edit")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? t("commitments.edit") : t("commitments.add")}</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="commitment-name">{t("commitments.nameLabel")}</Label>
              <Input id="commitment-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="commitment-amount">{t("commitments.amountLabel")}</Label>
              <NumberInput id="commitment-amount" value={amountLimit} onChange={setAmountLimit} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="commitment-due-day">{t("commitments.dueDayFieldLabel")}</Label>
              <Input
                id="commitment-due-day"
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                value={dueDay}
                onChange={(event) => setDueDay(event.target.value)}
              />
            </div>
            {dialog?.mode === "edit" && (
              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <Button type="button" variant="outline" onClick={() => toggleArchived(dialog.commitment)} disabled={updateCommitment.isPending}>
                  {dialog.commitment.archivedAt ? t("commitments.activate") : t("commitments.deactivate")}
                </Button>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                {t("categories.cancel")}
              </Button>
              <Button type="submit" disabled={createCommitment.isPending || updateCommitment.isPending}>
                {t("categories.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
