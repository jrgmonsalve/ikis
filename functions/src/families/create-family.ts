import { createHash } from 'node:crypto';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { assertAuthenticated, assertString } from '../shared/errors';
import { db, nowField } from '../shared/firestore';

function normalizeFamilyName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-CO');
}

function familyReservationId(normalizedName: string): string {
  return createHash('sha256').update(normalizedName).digest('hex');
}

function defaultActivePeriod(): {
  periodType: 'monthly';
  month: number;
  year: number;
  customStart: null;
  customEnd: null;
} {
  const now = new Date();
  return {
    periodType: 'monthly',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    customStart: null,
    customEnd: null,
  };
}

interface CreateFamilyInput {
  name: string;
  mainCurrency: 'COP' | 'USD';
}

export const createFamily = onCall<CreateFamilyInput>(async (request) => {
  const uid = request.auth?.uid;
  assertAuthenticated(uid);
  const { name, mainCurrency } = request.data;
  assertString(name, 'name');

  if (!['COP', 'USD'].includes(mainCurrency)) {
    throw new HttpsError('invalid-argument', 'mainCurrency must be COP or USD.');
  }

  const trimmedName = name.trim();
  const normalizedName = normalizeFamilyName(trimmedName);
  if (!normalizedName) {
    throw new HttpsError('invalid-argument', 'name must not be empty.');
  }

  const reservationRef = db.doc(
    `users/${uid}/familyNameReservations/${familyReservationId(normalizedName)}`,
  );
  const userRef = db.doc(`users/${uid}`);
  const authToken = request.auth?.token;

  const familyId = await db.runTransaction(async (tx) => {
    const [userSnapshot, reservationSnapshot] = await Promise.all([
      tx.get(userRef),
      tx.get(reservationRef),
    ]);

    const existingFamilyId = reservationSnapshot.exists
      ? reservationSnapshot.get('familyId')
      : undefined;
    if (typeof existingFamilyId === 'string' && existingFamilyId) {
      if (!userSnapshot.exists) {
        tx.set(userRef, {
          id: uid,
          googleProviderId: authToken?.firebase?.sign_in_provider ?? 'google.com',
          email: authToken?.email ?? '',
          displayName: authToken?.name ?? authToken?.email ?? 'IKIS user',
          photoUrl: authToken?.picture ?? null,
          preferredLanguage: 'es',
          defaultFamilyId: existingFamilyId,
          createdAt: nowField(),
          updatedAt: nowField(),
          lastLoginAt: nowField(),
          status: 'active',
        });
      } else {
        tx.update(userRef, {
          defaultFamilyId: existingFamilyId,
          updatedAt: nowField(),
        });
      }

      return existingFamilyId;
    }

    const familyRef = db.collection('families').doc();
    const memberRef = db.doc(`families/${familyRef.id}/members/${uid}`);

    if (!userSnapshot.exists) {
      tx.set(userRef, {
        id: uid,
        googleProviderId: authToken?.firebase?.sign_in_provider ?? 'google.com',
        email: authToken?.email ?? '',
        displayName: authToken?.name ?? authToken?.email ?? 'IKIS user',
        photoUrl: authToken?.picture ?? null,
        preferredLanguage: 'es',
        defaultFamilyId: familyRef.id,
        createdAt: nowField(),
        updatedAt: nowField(),
        lastLoginAt: nowField(),
        status: 'active',
      });
    } else {
      tx.update(userRef, {
        defaultFamilyId: familyRef.id,
        updatedAt: nowField(),
      });
    }

    tx.set(familyRef, {
      id: familyRef.id,
      name: trimmedName,
      normalizedName,
      mainCurrency,
      ownerUserId: uid,
      activePeriod: defaultActivePeriod(),
      createdAt: nowField(),
      updatedAt: nowField(),
      status: 'active',
    });

    tx.set(memberRef, {
      id: uid,
      familyId: familyRef.id,
      userId: uid,
      email: authToken?.email ?? '',
      displayName: authToken?.name ?? authToken?.email ?? 'IKIS user',
      role: 'owner',
      joinedAt: nowField(),
      status: 'active',
    });

    tx.set(reservationRef, {
      id: reservationRef.id,
      familyId: familyRef.id,
      ownerUserId: uid,
      normalizedName,
      createdAt: nowField(),
      updatedAt: nowField(),
      status: 'active',
    });

    return familyRef.id;
  });

  return { familyId };
});
