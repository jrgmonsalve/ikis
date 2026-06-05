import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { assertAuthenticated, assertPositiveAmount, assertString } from '../shared/errors';
import { AccountDoc, assertActiveMember, db, getActiveFamily, nowField, toTimestamp } from '../shared/firestore';

interface MarkPaidInput {
  familyId: string;
  recurringPaymentId: string;
  amount: number;
  accountId: string;
  categoryId: string;
  paymentDate?: string;
}

export const markRecurringPaymentAsPaid = onCall<MarkPaidInput>(async (request) => {
  const uid = request.auth?.uid;
  assertAuthenticated(uid);
  const { familyId, recurringPaymentId, amount, accountId, categoryId } = request.data;
  assertString(familyId, 'familyId');
  assertString(recurringPaymentId, 'recurringPaymentId');
  assertString(accountId, 'accountId');
  assertString(categoryId, 'categoryId');
  assertPositiveAmount(amount);

  await assertActiveMember(familyId, uid);
  const family = await getActiveFamily(familyId);
  const paymentDate = toTimestamp(request.data.paymentDate ?? new Date().toISOString());

  return db.runTransaction(async (tx) => {
    const recurringRef = db.doc(`families/${familyId}/recurringPayments/${recurringPaymentId}`);
    const accountRef = db.doc(`families/${familyId}/accounts/${accountId}`);
    const categoryRef = db.doc(`families/${familyId}/categories/${categoryId}`);
    const [recurringSnapshot, accountSnapshot, categorySnapshot] = await Promise.all([
      tx.get(recurringRef),
      tx.get(accountRef),
      tx.get(categoryRef),
    ]);

    if (!recurringSnapshot.exists || recurringSnapshot.get('status') !== 'active') {
      throw new HttpsError('not-found', 'Recurring payment was not found.');
    }
    if (!accountSnapshot.exists || accountSnapshot.get('status') !== 'active') {
      throw new HttpsError('not-found', 'Account was not found.');
    }
    if (!categorySnapshot.exists || categorySnapshot.get('status') !== 'active') {
      throw new HttpsError('not-found', 'Category was not found.');
    }

    const account = accountSnapshot.data() as AccountDoc;
    const recurring = recurringSnapshot.data();
    if (!recurring) {
      throw new HttpsError('not-found', 'Recurring payment was not found.');
    }
    const nextDueDate = calculateNextDueDate(recurring['frequency'], recurring['nextDueDate']);
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
      description: recurring['name'] ?? null,
      transactionDate: paymentDate,
      createdByUserId: uid,
      createdAt: nowField(),
      updatedAt: nowField(),
      status: 'active',
      source: 'recurring_payment',
      recurringPaymentId,
    });
    tx.update(accountRef, {
      currentBalance: FieldValue.increment(balanceDelta),
      updatedAt: nowField(),
    });
    tx.update(recurringRef, {
      lastPaidAt: paymentDate,
      nextDueDate,
      updatedAt: nowField(),
    });

    return { transactionId: transactionRef.id, nextDueDate: nextDueDate.toDate().toISOString() };
  });
});

function calculateNextDueDate(frequency: unknown, current: unknown): Timestamp {
  if (!(current instanceof Timestamp)) {
    throw new HttpsError('invalid-argument', 'Recurring payment nextDueDate is invalid.');
  }

  const date = current.toDate();
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      throw new HttpsError('invalid-argument', 'Custom frequency requires manual next due date handling.');
  }

  return Timestamp.fromDate(date);
}
