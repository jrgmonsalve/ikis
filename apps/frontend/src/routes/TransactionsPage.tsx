import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AddMovementDialog } from "@/components/AddMovementDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccounts } from "@/features/accounts/hooks";
import { flattenCategories } from "@/features/categories/flatten";
import { useCategoryTree } from "@/features/categories/hooks";
import type { Transaction } from "@/features/transactions/api";
import { useDeleteTransaction, useTransactions } from "@/features/transactions/hooks";
import type { Transfer } from "@/features/transfers/api";
import { useDeleteTransfer, useTransfers } from "@/features/transfers/hooks";
import { formatMoney } from "@/lib/format";

function TransactionsList({ onEdit }: { onEdit: (transaction: Transaction) => void }) {
  const { t } = useTranslation();
  const { data: transactions, isLoading } = useTransactions();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategoryTree();
  const deleteTransaction = useDeleteTransaction();

  const accountName = (id: string) => accounts?.find((account) => account.id === id)?.name ?? id;
  const flatCategories = categories ? flattenCategories(categories) : [];
  const categoryName = (id: string | null) => (id ? (flatCategories.find((c) => c.id === id)?.label ?? id) : "—");

  function handleDelete(transaction: Transaction) {
    if (window.confirm(t("movements.deleteConfirm"))) {
      deleteTransaction.mutate(transaction.id);
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }
  if (transactions?.length === 0) {
    return <p className="text-muted-foreground">{t("movements.emptyTransactions")}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {transactions?.map((transaction) => {
        const account = accounts?.find((a) => a.id === transaction.accountId);
        return (
          <li key={transaction.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <div>
              <p className="font-medium">{transaction.description || categoryName(transaction.categoryId)}</p>
              <p className="text-sm text-muted-foreground">
                {transaction.occurredAt} · {accountName(transaction.accountId)}
                {transaction.categoryId ? ` · ${categoryName(transaction.categoryId)}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`font-medium tabular-nums ${transaction.amount < 0 ? "text-destructive" : "text-success"}`}
              >
                {formatMoney(transaction.amount, account?.currency ?? "COP")}
              </span>
              <Button variant="ghost" size="sm" onClick={() => onEdit(transaction)}>
                {t("categories.rename")}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(transaction)}>
                {t("categories.delete")}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TransfersList({ onEdit }: { onEdit: (transfer: Transfer) => void }) {
  const { t } = useTranslation();
  const { data: transfers, isLoading } = useTransfers();
  const { data: accounts } = useAccounts();
  const deleteTransfer = useDeleteTransfer();

  const accountName = (id: string) => accounts?.find((account) => account.id === id)?.name ?? id;

  function handleDelete(transfer: Transfer) {
    if (window.confirm(t("movements.deleteConfirm"))) {
      deleteTransfer.mutate(transfer.id);
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }
  if (transfers?.length === 0) {
    return <p className="text-muted-foreground">{t("movements.emptyTransfers")}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {transfers?.map((transfer) => {
        const account = accounts?.find((a) => a.id === transfer.fromAccountId);
        return (
          <li key={transfer.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <div>
              <p className="font-medium">
                {accountName(transfer.fromAccountId)} → {accountName(transfer.toAccountId)}
              </p>
              <p className="text-sm text-muted-foreground">{transfer.occurredAt}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium tabular-nums">{formatMoney(transfer.amount, account?.currency ?? "COP")}</span>
              <Button variant="ghost" size="sm" onClick={() => onEdit(transfer)}>
                {t("categories.rename")}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(transfer)}>
                {t("categories.delete")}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function TransactionsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"transactions" | "transfers">("transactions");
  const [addOpen, setAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);

  function openAdd() {
    setEditingTransaction(null);
    setEditingTransfer(null);
    setAddOpen(true);
  }

  function openEditTransaction(transaction: Transaction) {
    setEditingTransaction(transaction);
    setEditingTransfer(null);
    setAddOpen(true);
  }

  function openEditTransfer(transfer: Transfer) {
    setEditingTransfer(transfer);
    setEditingTransaction(null);
    setAddOpen(true);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-medium">{t("movements.title")}</h1>
        <Button onClick={openAdd}>{t("movements.add")}</Button>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList className="w-full">
          <TabsTrigger value="transactions">{t("movements.tabTransactions")}</TabsTrigger>
          <TabsTrigger value="transfers">{t("movements.tabTransfers")}</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions">
          <TransactionsList onEdit={openEditTransaction} />
        </TabsContent>
        <TabsContent value="transfers">
          <TransfersList onEdit={openEditTransfer} />
        </TabsContent>
      </Tabs>

      <AddMovementDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        editingTransaction={editingTransaction}
        editingTransfer={editingTransfer}
      />
    </div>
  );
}
