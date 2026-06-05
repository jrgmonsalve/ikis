import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();

export type AccountType = 'savings' | 'cash' | 'digital_wallet' | 'credit_card';
export type Currency = 'COP' | 'USD';

export interface AccountDoc {
  id: string;
  familyId: string;
  type: AccountType;
  currentBalance: number;
  currency: Currency;
  status: 'active' | 'inactive';
}

export interface CategoryDoc {
  id: string;
  familyId: string;
  currency?: Currency;
  status: 'active' | 'inactive';
}

export interface FamilyDoc {
  id: string;
  mainCurrency: Currency;
  status: 'active' | 'inactive';
}

export function nowField(): FieldValue {
  return FieldValue.serverTimestamp();
}

export function toTimestamp(value: unknown): Timestamp {
  if (value instanceof Timestamp) {
    return value;
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return Timestamp.fromDate(date);
    }
  }

  throw new HttpsError('invalid-argument', 'transactionDate must be a valid ISO date string.');
}

export async function assertActiveMember(familyId: string, uid: string): Promise<void> {
  const member = await db.doc(`families/${familyId}/members/${uid}`).get();
  if (!member.exists || member.get('status') !== 'active') {
    throw new HttpsError('permission-denied', 'User is not an active family member.');
  }
}

export async function getActiveFamily(familyId: string): Promise<FamilyDoc> {
  const snapshot = await db.doc(`families/${familyId}`).get();
  if (!snapshot.exists || snapshot.get('status') !== 'active') {
    throw new HttpsError('not-found', 'Family was not found.');
  }
  return snapshot.data() as FamilyDoc;
}
