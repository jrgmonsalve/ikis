import type { FormEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts } from "@/features/accounts/hooks";
import { flattenCategories } from "@/features/categories/flatten";
import { useCategoryTree } from "@/features/categories/hooks";
import type { Commitment } from "@/features/commitments/api";
import { useCommitments, useCreateCommitment, useMarkCommitmentPaid, useUnmarkCommitmentPaid, useUpdateCommitment } from "@/features/commitments/hooks";
import { ApiError } from "@/lib/api-client";
import { formatMoney } from "@/lib/format";

const NO_CATEGORY = "none";

type DialogState = { mode: "create" } | { mode: "edit"; commitment: Commitment };

export function CommitmentsPage() {
  const { t } = useTranslation();
  const { data: commitments, isLoading } = useCommitments();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategoryTree();
  const createCommitment = useCreateCommitment();
  const updateCommitment = useUpdateCommitment();
  const markPaid = useMarkCommitmentPaid();
  const unmarkPaid = useUnmarkCommitmentPaid();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [name, setName] = useState("");
  const [amountLimit, setAmountLimit] = useState<number | undefined>(undefined);
  const [dueDay, setDueDay] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState(NO_CATEGORY);
  const [budgetError, setBudgetError] = useState<{ id: string; remaining: number } | null>(null);

  const activeAccounts = accounts?.filter((account) => account.archivedAt === null) ?? [];
  const flatCategories = categories ? flattenCategories(categories) : [];
  const accountName = (id: string) => accounts?.find((account) => account.id === id)?.name ?? id;
  const categoryName = (id: string) => flatCategories.find((category) => category.id === id)?.label ?? id;

  function openCreate() {
    setDialog({ mode: "create" });
    setName("");
    setAmountLimit(undefined);
    setDueDay("");
    setAccountId("");
    setCategoryId(NO_CATEGORY);
  }

  function openEdit(commitment: Commitment) {
    setDialog({ mode: "edit", commitment });
    setName(commitment.name);
    setAmountLimit(commitment.amountLimit);
    setDueDay(String(commitment.dueDay));
    setAccountId(commitment.accountId);
    setCategoryId(commitment.categoryId ?? NO_CATEGORY);
  }

  function close() {
    setDialog(null);
  }

  function toggleArchived(commitment: Commitment) {
    updateCommitment.mutate({ id: commitment.id, changes: { archived: commitment.archivedAt === null } }, { onSuccess: close });
  }

  function togglePaid(commitment: Commitment) {
    setBudgetError(null);
    if (commitment.paidThisPeriod) {
      unmarkPaid.mutate({ id: commitment.id, period: commitment.currentPeriod });
      return;
    }
    markPaid.mutate(
      { id: commitment.id, period: commitment.currentPeriod },
      {
        onError: (err) => {
          if (err instanceof ApiError && typeof err.body.remaining === "number") {
            setBudgetError({ id: commitment.id, remaining: err.body.remaining as number });
          }
        },
      },
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const day = Number(dueDay);
    if (!name.trim() || !amountLimit || amountLimit <= 0 || !dueDay || day < 1 || day > 31 || !accountId) {
      return;
    }
    const resolvedCategoryId = categoryId === NO_CATEGORY ? null : categoryId;

    if (dialog?.mode === "create") {
      createCommitment.mutate(
        { name: name.trim(), amountLimit, dueDay: day, accountId, categoryId: resolvedCategoryId },
        { onSuccess: close },
      );
    } else if (dialog?.mode === "edit") {
      updateCommitment.mutate(
        { id: dialog.commitment.id, changes: { name: name.trim(), amountLimit, dueDay: day, accountId, categoryId: resolvedCategoryId } },
        { onSuccess: close },
      );
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
          <li key={commitment.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{commitment.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t("commitments.dueDayLabel", { day: commitment.dueDay })} · {accountName(commitment.accountId)}
                  {commitment.categoryId && ` · ${categoryName(commitment.categoryId)}`}
                </p>
              </div>
              <span className="font-medium tabular-nums">{formatMoney(commitment.amountLimit, "COP")}</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant={commitment.paidThisPeriod ? "outline" : "default"}
                size="sm"
                disabled={markPaid.isPending || unmarkPaid.isPending}
                onClick={() => togglePaid(commitment)}
              >
                {commitment.paidThisPeriod ? t("commitments.undoPaid") : t("commitments.markPaid")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openEdit(commitment)}>
                {t("commitments.edit")}
              </Button>
            </div>
            {budgetError?.id === commitment.id && (
              <p className="text-sm text-destructive">
                {t("movements.budgetExceeded", { remaining: formatMoney(budgetError.remaining, "COP") })}
              </p>
            )}
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
            <div className="flex flex-col gap-1.5">
              <Label>{t("commitments.accountLabel")}</Label>
              <Select value={accountId} onValueChange={(value) => setAccountId(value ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("movements.selectAccount")}>
                    {(value: string) => activeAccounts.find((account) => account.id === value)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("commitments.categoryLabel")}</Label>
              <Select value={categoryId} onValueChange={(value) => setCategoryId(value ?? NO_CATEGORY)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => (value === NO_CATEGORY ? t("commitments.noCategory") : categoryName(value))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>{t("commitments.noCategory")}</SelectItem>
                  {flatCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
