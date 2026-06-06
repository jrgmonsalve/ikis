import { FieldValue } from 'firebase-admin/firestore';
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
