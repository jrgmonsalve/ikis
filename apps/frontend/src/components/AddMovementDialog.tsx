import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccounts } from "@/features/accounts/hooks";
import { flattenCategories } from "@/features/categories/flatten";
import { useCategoryTree } from "@/features/categories/hooks";
import type { Transaction } from "@/features/transactions/api";
import { useCreateTransaction, useUpdateTransaction } from "@/features/transactions/hooks";
import type { Transfer } from "@/features/transfers/api";
import { useCreateTransfer, useUpdateTransfer } from "@/features/transfers/hooks";

const today = () => new Date().toISOString().slice(0, 10);

const expenseSchema = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().min(1),
  amount: z.number().positive(),
  occurredAt: z.string().min(1),
  description: z.string(),
});
type ExpenseFormValues = z.infer<typeof expenseSchema>;

function ExpenseForm({ editing, onSuccess }: { editing?: Transaction | null; onSuccess: () => void }) {
  const { t } = useTranslation();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategoryTree();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const flatCategories = categories ? flattenCategories(categories) : [];

  const { control, register, handleSubmit } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: editing
      ? {
          accountId: editing.accountId,
          categoryId: editing.categoryId ?? "",
          amount: Math.abs(editing.amount),
          occurredAt: editing.occurredAt,
          description: editing.description ?? "",
        }
      : { accountId: "", categoryId: "", occurredAt: today(), description: "" },
  });

  function onSubmit(values: ExpenseFormValues) {
    const payload = {
      accountId: values.accountId,
      categoryId: values.categoryId,
      amount: -Math.abs(values.amount),
      description: values.description || null,
      occurredAt: values.occurredAt,
    };
    if (editing) {
      updateTransaction.mutate({ id: editing.id, changes: payload }, { onSuccess });
    } else {
      createTransaction.mutate(payload, { onSuccess });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 pt-2">
      <div className="flex flex-col gap-1.5">
        <Label>{t("movements.account")}</Label>
        <Controller
          name="accountId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("movements.selectAccount")}>
                  {(value: string) => accounts?.find((account) => account.id === value)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("movements.category")}</Label>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("movements.selectCategory")}>
                  {(value: string) => flatCategories.find((category) => category.id === value)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {flatCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("movements.amount")}</Label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => <NumberInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("movements.date")}</Label>
        <Input type="date" {...register("occurredAt")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("movements.description")}</Label>
        <Input {...register("description")} />
      </div>
      <Button type="submit" disabled={createTransaction.isPending || updateTransaction.isPending}>
        {t("movements.save")}
      </Button>
    </form>
  );
}

const incomeSchema = z.object({
  accountId: z.string().min(1),
  amount: z.number().positive(),
  occurredAt: z.string().min(1),
  description: z.string(),
});
type IncomeFormValues = z.infer<typeof incomeSchema>;

function IncomeForm({ editing, onSuccess }: { editing?: Transaction | null; onSuccess: () => void }) {
  const { t } = useTranslation();
  const { data: accounts } = useAccounts();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const { control, register, handleSubmit } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: editing
      ? {
          accountId: editing.accountId,
          amount: editing.amount,
          occurredAt: editing.occurredAt,
          description: editing.description ?? "",
        }
      : { accountId: "", occurredAt: today(), description: "" },
  });

  function onSubmit(values: IncomeFormValues) {
    const payload = {
      accountId: values.accountId,
      categoryId: null,
      amount: Math.abs(values.amount),
      description: values.description || null,
      occurredAt: values.occurredAt,
    };
    if (editing) {
      updateTransaction.mutate({ id: editing.id, changes: payload }, { onSuccess });
    } else {
      createTransaction.mutate(payload, { onSuccess });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 pt-2">
      <div className="flex flex-col gap-1.5">
        <Label>{t("movements.account")}</Label>
        <Controller
          name="accountId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("movements.selectAccount")}>
                  {(value: string) => accounts?.find((account) => account.id === value)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("movements.amount")}</Label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => <NumberInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("movements.date")}</Label>
        <Input type="date" {...register("occurredAt")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("movements.description")}</Label>
        <Input {...register("description")} />
      </div>
      <Button type="submit" disabled={createTransaction.isPending || updateTransaction.isPending}>
        {t("movements.save")}
      </Button>
    </form>
  );
}

const transferSchema = z
  .object({
    fromAccountId: z.string().min(1),
    toAccountId: z.string().min(1),
    amount: z.number().positive(),
    occurredAt: z.string().min(1),
    description: z.string(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "movements.sameAccountError",
    path: ["toAccountId"],
  });
type TransferFormValues = z.infer<typeof transferSchema>;

function TransferForm({ editing, onSuccess }: { editing?: Transfer | null; onSuccess: () => void }) {
  const { t } = useTranslation();
  const { data: accounts } = useAccounts();
  const createTransfer = useCreateTransfer();
  const updateTransfer = useUpdateTransfer();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: editing
      ? {
          fromAccountId: editing.fromAccountId,
          toAccountId: editing.toAccountId,
          amount: editing.amount,
          occurredAt: editing.occurredAt,
          description: editing.description ?? "",
        }
      : { fromAccountId: "", toAccountId: "", occurredAt: today(), description: "" },
  });

  function onSubmit(values: TransferFormValues) {
    const payload = {
      fromAccountId: values.fromAccountId,
      toAccountId: values.toAccountId,
      amount: values.amount,
      description: values.description || null,
      occurredAt: values.occurredAt,
    };
    if (editing) {
      updateTransfer.mutate({ id: editing.id, changes: payload }, { onSuccess });
    } else {
      createTransfer.mutate(payload, { onSuccess });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 pt-2">
      <div className="flex flex-col gap-1.5">
        <Label>{t("movements.fromAccount")}</Label>
        <Controller
          name="fromAccountId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("movements.selectAccount")}>
                  {(value: string) => accounts?.find((account) => account.id === value)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("movements.toAccount")}</Label>
        <Controller
          name="toAccountId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("movements.selectAccount")}>
                  {(value: string) => accounts?.find((account) => account.id === value)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.toAccountId && <p className="text-sm text-destructive">{t(errors.toAccountId.message as string)}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("movements.amount")}</Label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => <NumberInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("movements.date")}</Label>
        <Input type="date" {...register("occurredAt")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("movements.description")}</Label>
        <Input {...register("description")} />
      </div>
      <Button type="submit" disabled={createTransfer.isPending || updateTransfer.isPending}>
        {t("movements.save")}
      </Button>
    </form>
  );
}

type AddMovementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTransaction?: Transaction | null;
  editingTransfer?: Transfer | null;
};

export function AddMovementDialog({
  open,
  onOpenChange,
  editingTransaction,
  editingTransfer,
}: AddMovementDialogProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"expense" | "income" | "transfer">("expense");

  function close() {
    onOpenChange(false);
  }

  if (editingTransaction) {
    const isIncome = editingTransaction.amount > 0;
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isIncome ? t("movements.editIncome") : t("movements.editExpense")}</DialogTitle>
          </DialogHeader>
          {isIncome ? (
            <IncomeForm editing={editingTransaction} onSuccess={close} />
          ) : (
            <ExpenseForm editing={editingTransaction} onSuccess={close} />
          )}
        </DialogContent>
      </Dialog>
    );
  }

  if (editingTransfer) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("movements.editTransfer")}</DialogTitle>
          </DialogHeader>
          <TransferForm editing={editingTransfer} onSuccess={close} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("movements.addTitle")}</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
          <TabsList className="w-full">
            <TabsTrigger value="expense">{t("movements.expense")}</TabsTrigger>
            <TabsTrigger value="income">{t("movements.income")}</TabsTrigger>
            <TabsTrigger value="transfer">{t("movements.transfer")}</TabsTrigger>
          </TabsList>
          <TabsContent value="expense">
            <ExpenseForm onSuccess={close} />
          </TabsContent>
          <TabsContent value="income">
            <IncomeForm onSuccess={close} />
          </TabsContent>
          <TabsContent value="transfer">
            <TransferForm onSuccess={close} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
