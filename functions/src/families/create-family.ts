import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { assertAuthenticated, assertString } from '../shared/errors';
import { db, nowField } from '../shared/firestore';

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

  const familyRef = db.collection('families').doc();
  const memberRef = db.doc(`families/${familyRef.id}/members/${uid}`);
  const userRef = db.doc(`users/${uid}`);
  const authToken = request.auth?.token;

  await db.runTransaction(async (tx) => {
    const userSnapshot = await tx.get(userRef);

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
      name: name.trim(),
      mainCurrency,
      ownerUserId: uid,
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
  });

  return { familyId: familyRef.id };
});
