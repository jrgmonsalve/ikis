import { FieldValue, Timestamp, Transaction as FirestoreTransaction } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { assertAuthenticated, assertPositiveAmount, assertString } from '../shared/errors';
import { AccountDoc, assertActiveMember, db, getActiveFamily, nowField, toTimestamp } from '../shared/firestore';

interface CreateTransactionInput {
  familyId: string;
  amount: number;
  accountId?: string;
  categoryId?: string;
  sourceAccountId?: string;
  destinationAccountId?: string;
  description?: string;
  transactionDate?: string;
  subcategoryId?: string | null;
}

interface UpdateTransactionInput extends CreateTransactionInput {
  transactionId: string;
}

interface CancelTransactionInput {
  familyId: string;
  transactionId: string;
}

interface TransactionDoc {
  id: string;
  familyId: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  currency: string;
  accountId?: string;
  categoryId?: string;
  subcategoryId?: string | null;
  sourceAccountId?: string;
  destinationAccountId?: string;
  description?: string | null;
  transactionDate: Timestamp;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'cancelled';
  source: 'manual' | 'recurring_payment';
  recurringPaymentId?: string | null;
}

export const createExpense = onCall<CreateTransactionInput>(async (request) => {
  const uid = request.auth?.uid;
  assertAuthenticated(uid);
  const { familyId, amount, accountId, categoryId } = request.data;
  assertString(familyId, 'familyId');
  assertString(accountId, 'accountId');
  assertString(categoryId, 'categoryId');
  assertPositiveAmount(amount);

  await assertActiveMember(familyId, uid);
  const family = await getActiveFamily(familyId);
  const transactionDate = toTimestamp(request.data.transactionDate ?? new Date().toISOString());
  const subcategoryId = normalizeOptionalSubcategoryId(request.data.subcategoryId);
  await assertSubcategorySelection(familyId, categoryId, subcategoryId);

  return db.runTransaction(async (tx) => {
    const accountRef = db.doc(`families/${familyId}/accounts/${accountId}`);
    const categoryRef = db.doc(`families/${familyId}/categories/${categoryId}`);
    const [accountSnapshot, categorySnapshot] = await Promise.all([tx.get(accountRef), tx.get(categoryRef)]);

    if (!accountSnapshot.exists || accountSnapshot.get('status') !== 'active') {
      throw new HttpsError('not-found', 'Account was not found.');
    }
    if (!categorySnapshot.exists || categorySnapshot.get('status') !== 'active') {
      throw new HttpsError('not-found', 'Category was not found.');
    }
    if (subcategoryId) {
      await assertActiveSubcategoryInTransaction(tx, familyId, categoryId, subcategoryId);
    }

    const account = accountSnapshot.data() as AccountDoc;
    const balanceDelta = account.type === 'credit_card' ? amount : -amount;
    const transactionRef = db.collection(`families/${familyId}/transactions`).doc();

    tx.set(transactionRef, {
      id: transactionRef.id,
      familyId,
      type: 'expense',
      amount,
      currency: family.mainCurrency,
      accountId,
      categoryId,
      subcategoryId,
      description: request.data.description?.trim() || null,
      transactionDate,
      createdByUserId: uid,
      createdAt: nowField(),
      updatedAt: nowField(),
      status: 'active',
      source: 'manual',
      recurringPaymentId: null,
    });
    tx.update(accountRef, {
      currentBalance: FieldValue.increment(balanceDelta),
      updatedAt: nowField(),
    });

    return { transactionId: transactionRef.id };
  });
});

export const createIncome = onCall<CreateTransactionInput>(async (request) => {
  const uid = request.auth?.uid;
  assertAuthenticated(uid);
  const { familyId, amount, accountId, categoryId } = request.data;
  assertString(familyId, 'familyId');
  assertString(accountId, 'accountId');
  assertString(categoryId, 'categoryId');
  assertPositiveAmount(amount);

  await assertActiveMember(familyId, uid);
  const family = await getActiveFamily(familyId);
  const transactionDate = toTimestamp(request.data.transactionDate ?? new Date().toISOString());
  const subcategoryId = normalizeOptionalSubcategoryId(request.data.subcategoryId);
  await assertSubcategorySelection(familyId, categoryId, subcategoryId);

  return db.runTransaction(async (tx) => {
    const accountRef = db.doc(`families/${familyId}/accounts/${accountId}`);
    const categoryRef = db.doc(`families/${familyId}/categories/${categoryId}`);
    const [accountSnapshot, categorySnapshot] = await Promise.all([tx.get(accountRef), tx.get(categoryRef)]);

    if (!accountSnapshot.exists || accountSnapshot.get('status') !== 'active') {
      throw new HttpsError('not-found', 'Account was not found.');
    }
    if (!categorySnapshot.exists || categorySnapshot.get('status') !== 'active') {
      throw new HttpsError('not-found', 'Category was not found.');
    }
    if (subcategoryId) {
      await assertActiveSubcategoryInTransaction(tx, familyId, categoryId, subcategoryId);
    }

    const account = accountSnapshot.data() as AccountDoc;
    const balanceDelta = account.type === 'credit_card' ? -amount : amount;
    const transactionRef = db.collection(`families/${familyId}/transactions`).doc();
    tx.set(transactionRef, {
      id: transactionRef.id,
      familyId,
      type: 'income',
      amount,
      currency: family.mainCurrency,
      accountId,
      categoryId,
      subcategoryId,
      description: request.data.description?.trim() || null,
      transactionDate,
      createdByUserId: uid,
      createdAt: nowField(),
      updatedAt: nowField(),
      status: 'active',
      source: 'manual',
      recurringPaymentId: null,
    });
    tx.update(accountRef, {
      currentBalance: FieldValue.increment(balanceDelta),
      updatedAt: nowField(),
    });

    return { transactionId: transactionRef.id };
  });
});

export const createTransfer = onCall<CreateTransactionInput>(async (request) => {
  const uid = request.auth?.uid;
  assertAuthenticated(uid);
  const { familyId, amount, sourceAccountId, destinationAccountId } = request.data;
  assertString(familyId, 'familyId');
  assertString(sourceAccountId, 'sourceAccountId');
  assertString(destinationAccountId, 'destinationAccountId');
  assertPositiveAmount(amount);

  if (sourceAccountId === destinationAccountId) {
    throw new HttpsError('invalid-argument', 'Source and destination accounts must be different.');
  }

  await assertActiveMember(familyId, uid);
  const family = await getActiveFamily(familyId);
  const transactionDate = toTimestamp(request.data.transactionDate ?? new Date().toISOString());

  return db.runTransaction(async (tx) => {
    const sourceRef = db.doc(`families/${familyId}/accounts/${sourceAccountId}`);
    const destinationRef = db.doc(`families/${familyId}/accounts/${destinationAccountId}`);
    const [sourceSnapshot, destinationSnapshot] = await Promise.all([tx.get(sourceRef), tx.get(destinationRef)]);

    if (!sourceSnapshot.exists || sourceSnapshot.get('status') !== 'active') {
      throw new HttpsError('not-found', 'Source account was not found.');
    }
    if (!destinationSnapshot.exists || destinationSnapshot.get('status') !== 'active') {
      throw new HttpsError('not-found', 'Destination account was not found.');
    }

    const sourceAccount = sourceSnapshot.data() as AccountDoc;
    const destinationAccount = destinationSnapshot.data() as AccountDoc;
    const sourceDelta = sourceAccount.type === 'credit_card' ? amount : -amount;
    const destinationDelta = destinationAccount.type === 'credit_card' ? -amount : amount;
    const transactionRef = db.collection(`families/${familyId}/transactions`).doc();
    tx.set(transactionRef, {
      id: transactionRef.id,
      familyId,
      type: 'transfer',
      amount,
      currency: family.mainCurrency,
      sourceAccountId,
      destinationAccountId,
      description: request.data.description?.trim() || null,
      transactionDate,
      createdByUserId: uid,
      createdAt: nowField(),
      updatedAt: nowField(),
      status: 'active',
      source: 'manual',
      recurringPaymentId: null,
    });
    tx.update(sourceRef, { currentBalance: FieldValue.increment(sourceDelta), updatedAt: nowField() });
    tx.update(destinationRef, { currentBalance: FieldValue.increment(destinationDelta), updatedAt: nowField() });

    return { transactionId: transactionRef.id };
  });
});

export const cancelTransaction = onCall<CancelTransactionInput>(async (request) => {
  const uid = request.auth?.uid;
  assertAuthenticated(uid);
  const { familyId, transactionId } = request.data;
  assertString(familyId, 'familyId');
  assertString(transactionId, 'transactionId');

  await assertActiveMember(familyId, uid);

  return db.runTransaction(async (tx) => {
    const transactionRef = db.doc(`families/${familyId}/transactions/${transactionId}`);
    const transactionSnapshot = await tx.get(transactionRef);

    if (!transactionSnapshot.exists) {
      throw new HttpsError('not-found', 'Transaction was not found.');
    }

    const transaction = transactionSnapshot.data() as TransactionDoc;
    assertEditableFamilyTransaction(transaction, familyId);
    if (transaction.status !== 'active') {
      throw new HttpsError('failed-precondition', 'Transaction is already cancelled.');
    }

    const accounts = await loadAccountsForEffect(tx, familyId, transaction, null);
    const rollback = invertEffect(buildAccountEffect(transaction, accounts.previous));

    tx.update(transactionRef, {
      status: 'cancelled',
      updatedAt: nowField(),
    });
    applyBalanceDeltas(tx, familyId, rollback);

    return { transactionId };
  });
});

export const updateTransaction = onCall<UpdateTransactionInput>(async (request) => {
  const uid = request.auth?.uid;
  assertAuthenticated(uid);
  const { familyId, transactionId, amount } = request.data;
  assertString(familyId, 'familyId');
  assertString(transactionId, 'transactionId');
  assertPositiveAmount(amount);

  await assertActiveMember(familyId, uid);
  const transactionDate = toTimestamp(request.data.transactionDate ?? new Date().toISOString());

  return db.runTransaction(async (tx) => {
    const transactionRef = db.doc(`families/${familyId}/transactions/${transactionId}`);
    const transactionSnapshot = await tx.get(transactionRef);

    if (!transactionSnapshot.exists) {
      throw new HttpsError('not-found', 'Transaction was not found.');
    }

    const previous = transactionSnapshot.data() as TransactionDoc;
    assertEditableFamilyTransaction(previous, familyId);
    if (previous.status !== 'active') {
      throw new HttpsError('failed-precondition', 'Only active transactions can be edited.');
    }
    if (previous.source !== 'manual') {
      throw new HttpsError('failed-precondition', 'Recurring payment transactions cannot be edited.');
    }

    const next = await buildUpdatedTransaction(tx, previous, request.data, transactionDate);
    const accounts = await loadAccountsForEffect(tx, familyId, previous, next);
    const previousEffect = buildAccountEffect(previous, accounts.previous);
    const nextEffect = buildAccountEffect(next, accounts.next);
    const balanceDeltas = mergeEffects(invertEffect(previousEffect), nextEffect);

    tx.update(transactionRef, {
      amount: next.amount,
      accountId: next.accountId ?? FieldValue.delete(),
      categoryId: next.categoryId ?? FieldValue.delete(),
      subcategoryId: next.subcategoryId ?? null,
      sourceAccountId: next.sourceAccountId ?? FieldValue.delete(),
      destinationAccountId: next.destinationAccountId ?? FieldValue.delete(),
      description: next.description ?? null,
      transactionDate: next.transactionDate,
      updatedAt: nowField(),
    });
    applyBalanceDeltas(tx, familyId, balanceDeltas);

    return { transactionId };
  });
});

function normalizeOptionalSubcategoryId(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', 'subcategoryId must be a string.');
  }
  return value;
}

async function assertSubcategorySelection(
  familyId: string,
  categoryId: string,
  subcategoryId: string | null,
): Promise<void> {
  const activeSubcategories = await db
    .collection(`families/${familyId}/categories/${categoryId}/subcategories`)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (!activeSubcategories.empty && !subcategoryId) {
    throw new HttpsError('invalid-argument', 'Select a subcategory for this category.');
  }
}

async function assertActiveSubcategoryInTransaction(
  tx: FirestoreTransaction,
  familyId: string,
  categoryId: string,
  subcategoryId: string,
): Promise<void> {
  const subcategoryRef = db.doc(
    `families/${familyId}/categories/${categoryId}/subcategories/${subcategoryId}`,
  );
  const subcategorySnapshot = await tx.get(subcategoryRef);

  if (!subcategorySnapshot.exists || subcategorySnapshot.get('status') !== 'active') {
    throw new HttpsError('not-found', 'Subcategory was not found.');
  }
  if (
    subcategorySnapshot.get('familyId') !== familyId ||
    subcategorySnapshot.get('categoryId') !== categoryId
  ) {
    throw new HttpsError('invalid-argument', 'Subcategory does not belong to the selected category.');
  }
}

function assertEditableFamilyTransaction(transaction: TransactionDoc, familyId: string): void {
  if (transaction.familyId !== familyId) {
    throw new HttpsError('permission-denied', 'Transaction does not belong to the selected family.');
  }
}

async function buildUpdatedTransaction(
  tx: FirestoreTransaction,
  previous: TransactionDoc,
  input: UpdateTransactionInput,
  transactionDate: Timestamp,
): Promise<TransactionDoc> {
  if (previous.type === 'transfer') {
    assertString(input.sourceAccountId, 'sourceAccountId');
    assertString(input.destinationAccountId, 'destinationAccountId');
    if (input.sourceAccountId === input.destinationAccountId) {
      throw new HttpsError('invalid-argument', 'Source and destination accounts must be different.');
    }

    return {
      ...previous,
      amount: input.amount,
      sourceAccountId: input.sourceAccountId,
      destinationAccountId: input.destinationAccountId,
      accountId: undefined,
      categoryId: undefined,
      subcategoryId: null,
      description: input.description?.trim() || null,
      transactionDate,
    };
  }

  assertString(input.accountId, 'accountId');
  assertString(input.categoryId, 'categoryId');
  const categoryRef = db.doc(`families/${previous.familyId}/categories/${input.categoryId}`);
  const categorySnapshot = await tx.get(categoryRef);
  if (!categorySnapshot.exists || categorySnapshot.get('status') !== 'active') {
    throw new HttpsError('not-found', 'Category was not found.');
  }

  const subcategoryId = normalizeOptionalSubcategoryId(input.subcategoryId);
  await assertSubcategorySelection(previous.familyId, input.categoryId, subcategoryId);
  if (subcategoryId) {
    await assertActiveSubcategoryInTransaction(tx, previous.familyId, input.categoryId, subcategoryId);
  }

  return {
    ...previous,
    amount: input.amount,
    accountId: input.accountId,
    categoryId: input.categoryId,
    subcategoryId,
    sourceAccountId: undefined,
    destinationAccountId: undefined,
    description: input.description?.trim() || null,
    transactionDate,
  };
}

async function loadAccountsForEffect(
  tx: FirestoreTransaction,
  familyId: string,
  previous: TransactionDoc,
  next: TransactionDoc | null,
): Promise<{ previous: Map<string, AccountDoc>; next: Map<string, AccountDoc> }> {
  const previousIds = accountIdsForTransaction(previous);
  const nextIds = next ? accountIdsForTransaction(next) : [];
  const allIds = Array.from(new Set([...previousIds, ...nextIds]));
  const snapshots = await Promise.all(
    allIds.map((accountId) => tx.get(db.doc(`families/${familyId}/accounts/${accountId}`))),
  );

  const byId = new Map<string, AccountDoc>();
  snapshots.forEach((snapshot, index) => {
    if (!snapshot.exists) {
      throw new HttpsError('not-found', 'Account was not found.');
    }
    const account = snapshot.data() as AccountDoc;
    if (account.familyId !== familyId) {
      throw new HttpsError('invalid-argument', 'Account does not belong to the selected family.');
    }
    byId.set(allIds[index], account);
  });

  const previousAccounts = new Map<string, AccountDoc>();
  for (const accountId of previousIds) {
    const account = byId.get(accountId);
    if (!account) {
      throw new HttpsError('not-found', 'Account was not found.');
    }
    previousAccounts.set(accountId, account);
  }

  const nextAccounts = new Map<string, AccountDoc>();
  for (const accountId of nextIds) {
    const account = byId.get(accountId);
    if (!account) {
      throw new HttpsError('not-found', 'Account was not found.');
    }
    if (account.status !== 'active') {
      throw new HttpsError('failed-precondition', 'Selected account is inactive.');
    }
    nextAccounts.set(accountId, account);
  }

  return { previous: previousAccounts, next: nextAccounts };
}

function accountIdsForTransaction(transaction: TransactionDoc): string[] {
  if (transaction.type === 'transfer') {
    if (!transaction.sourceAccountId || !transaction.destinationAccountId) {
      throw new HttpsError('invalid-argument', 'Transfer accounts are required.');
    }
    return [transaction.sourceAccountId, transaction.destinationAccountId];
  }
  if (!transaction.accountId) {
    throw new HttpsError('invalid-argument', 'Transaction account is required.');
  }
  return [transaction.accountId];
}

function buildAccountEffect(transaction: TransactionDoc, accounts: Map<string, AccountDoc>): Map<string, number> {
  const effect = new Map<string, number>();

  if (transaction.type === 'expense') {
    const account = requireAccount(accounts, transaction.accountId);
    addEffect(effect, account.id, account.type === 'credit_card' ? transaction.amount : -transaction.amount);
    return effect;
  }

  if (transaction.type === 'income') {
    const account = requireAccount(accounts, transaction.accountId);
    addEffect(effect, account.id, account.type === 'credit_card' ? -transaction.amount : transaction.amount);
    return effect;
  }

  const source = requireAccount(accounts, transaction.sourceAccountId);
  const destination = requireAccount(accounts, transaction.destinationAccountId);
  addEffect(effect, source.id, source.type === 'credit_card' ? transaction.amount : -transaction.amount);
  addEffect(effect, destination.id, destination.type === 'credit_card' ? -transaction.amount : transaction.amount);
  return effect;
}

function requireAccount(accounts: Map<string, AccountDoc>, accountId: string | undefined): AccountDoc {
  if (!accountId) {
    throw new HttpsError('invalid-argument', 'Transaction account is required.');
  }
  const account = accounts.get(accountId);
  if (!account) {
    throw new HttpsError('not-found', 'Account was not found.');
  }
  return account;
}

function addEffect(effect: Map<string, number>, accountId: string, amount: number): void {
  effect.set(accountId, (effect.get(accountId) ?? 0) + amount);
}

function invertEffect(effect: Map<string, number>): Map<string, number> {
  const inverted = new Map<string, number>();
  for (const [accountId, amount] of effect.entries()) {
    inverted.set(accountId, -amount);
  }
  return inverted;
}

function mergeEffects(...effects: Map<string, number>[]): Map<string, number> {
  const merged = new Map<string, number>();
  for (const effect of effects) {
    for (const [accountId, amount] of effect.entries()) {
      addEffect(merged, accountId, amount);
    }
  }
  return merged;
}

function applyBalanceDeltas(
  tx: FirestoreTransaction,
  familyId: string,
  balanceDeltas: Map<string, number>,
): void {
  for (const [accountId, delta] of balanceDeltas.entries()) {
    if (delta === 0) {
      continue;
    }
    tx.update(db.doc(`families/${familyId}/accounts/${accountId}`), {
      currentBalance: FieldValue.increment(delta),
      updatedAt: nowField(),
    });
  }
}
