import type { FormEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Account, AccountType } from "@/features/accounts/api";
import { useAccounts, useCreateAccount, useDeleteAccount, useUpdateAccount } from "@/features/accounts/hooks";
import { formatMoney } from "@/lib/format";

const ACCOUNT_TYPES: AccountType[] = ["checking", "savings", "credit_card", "cash", "digital_wallet"];

type DialogState = { mode: "create" } | { mode: "edit"; account: Account };

export function AccountsPage() {
  const { t } = useTranslation();
  const { data: accounts, isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType | "">("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function openCreate() {
    setDialog({ mode: "create" });
    setName("");
    setType("");
    setConfirmingDelete(false);
    setActionError(null);
  }

  function openEdit(account: Account) {
    setDialog({ mode: "edit", account });
    setName(account.name);
    setType(account.type);
    setConfirmingDelete(false);
    setActionError(null);
  }

  function close() {
    setDialog(null);
  }

  function toggleArchived(account: Account) {
    updateAccount.mutate({ id: account.id, changes: { archived: account.archivedAt === null } }, { onSuccess: close });
  }

  function handleDelete(account: Account) {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteAccount.mutate(account.id, {
      onSuccess: close,
      onError: (err) => {
        setConfirmingDelete(false);
        setActionError(
          err instanceof Error && err.message.includes("movements") ? t("accounts.deleteHasMovements") : t("accounts.deleteError"),
        );
      },
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!dialog || !name.trim() || !type) {
      return;
    }

    if (dialog.mode === "create") {
      createAccount.mutate({ name: name.trim(), type }, { onSuccess: close });
    } else {
      updateAccount.mutate({ id: dialog.account.id, changes: { name: name.trim(), type } }, { onSuccess: close });
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-medium">{t("accounts.title")}</h1>
        <Button onClick={openCreate}>{t("accounts.add")}</Button>
      </div>

      {isLoading && <p className="text-muted-foreground">{t("common.loading")}</p>}
      {!isLoading && accounts?.length === 0 && <p className="text-muted-foreground">{t("accounts.empty")}</p>}

      <ul className="flex flex-col gap-2">
        {accounts?.map((account) => (
          <li
            key={account.id}
            className={`flex items-center justify-between rounded-xl border border-border bg-card p-3 ${account.archivedAt ? "opacity-60" : ""}`}
          >
            <div>
              <p className="font-medium">
                {account.name}
                {account.archivedAt && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                    {t("accounts.archivedBadge")}
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">{t(`accounts.types.${account.type}`)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium tabular-nums">{formatMoney(account.balance, account.currency)}</span>
              <Button variant="ghost" size="sm" onClick={() => openEdit(account)}>
                {t("accounts.edit")}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? t("accounts.edit") : t("accounts.add")}</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-name">{t("accounts.nameLabel")}</Label>
              <Input id="account-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("accounts.typeLabel")}</Label>
              <Select value={type} onValueChange={(value) => setType(value ? (value as AccountType) : "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("accounts.selectType")}>
                    {(value: AccountType) => (value ? t(`accounts.types.${value}`) : undefined)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((accountType) => (
                    <SelectItem key={accountType} value={accountType}>
                      {t(`accounts.types.${accountType}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {dialog?.mode === "edit" && (
              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toggleArchived(dialog.account)}
                  disabled={updateAccount.isPending}
                >
                  {dialog.account.archivedAt ? t("accounts.activate") : t("accounts.deactivate")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDelete(dialog.account)}
                  disabled={deleteAccount.isPending}
                >
                  {confirmingDelete ? t("accounts.deleteConfirm") : t("accounts.delete")}
                </Button>
                {actionError && <p className="text-sm text-destructive">{actionError}</p>}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                {t("categories.cancel")}
              </Button>
              <Button type="submit" disabled={createAccount.isPending || updateAccount.isPending}>
                {t("categories.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
