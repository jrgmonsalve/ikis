import { HttpsError } from 'firebase-functions/v2/https';

export function assertAuthenticated(uid: string | undefined): asserts uid is string {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }
}

export function assertPositiveAmount(amount: unknown): asserts amount is number {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new HttpsError('invalid-argument', 'Amount must be greater than zero.');
  }
}

export function assertString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpsError('invalid-argument', `${field} is required.`);
  }
}
