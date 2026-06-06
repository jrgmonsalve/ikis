import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { assertAuthenticated, assertString } from '../shared/errors';
import { db, nowField } from '../shared/firestore';

interface AcceptInvitationInput {
  familyId: string;
  invitationId: string;
}

export const acceptInvitation = onCall<AcceptInvitationInput>(async (request) => {
  const uid = request.auth?.uid;
  assertAuthenticated(uid);
  const { familyId, invitationId } = request.data;
  assertString(familyId, 'familyId');
  assertString(invitationId, 'invitationId');

  const email = request.auth?.token.email;
  if (typeof email !== 'string' || !email) {
    throw new HttpsError(
      'failed-precondition',
      'The authenticated account must provide an email address.',
    );
  }

  const invitationRef = db.doc(
    `families/${familyId}/invitations/${invitationId}`,
  );
  const memberRef = db.doc(`families/${familyId}/members/${uid}`);
  const userRef = db.doc(`users/${uid}`);

  await db.runTransaction(async (tx) => {
    const [invitationSnapshot, memberSnapshot] = await Promise.all([
      tx.get(invitationRef),
      tx.get(memberRef),
    ]);
    if (!invitationSnapshot.exists) {
      throw new HttpsError('not-found', 'Invitation was not found.');
    }

    if (memberSnapshot.exists) {
      throw new HttpsError('already-exists', 'User is already a family member.');
    }

    const invitation = invitationSnapshot.data();
    if (
      invitation?.status !== 'pending' ||
      typeof invitation.email !== 'string' ||
      invitation.email.toLowerCase() !== email.toLowerCase()
    ) {
      throw new HttpsError(
        'permission-denied',
        'Invitation does not belong to the authenticated user.',
      );
    }
    if (!['admin', 'member'].includes(invitation.role)) {
      throw new HttpsError('failed-precondition', 'Invitation role is invalid.');
    }
    if (
      !(invitation.expiresAt instanceof Timestamp) ||
      invitation.expiresAt.toMillis() < Date.now()
    ) {
      throw new HttpsError('failed-precondition', 'Invitation has expired.');
    }

    tx.set(memberRef, {
      id: uid,
      familyId,
      userId: uid,
      email,
      displayName: request.auth?.token.name ?? email,
      role: invitation.role,
      joinedAt: nowField(),
      status: 'active',
    });
    tx.update(invitationRef, {
      status: 'accepted',
      acceptedAt: nowField(),
    });
    tx.set(
      userRef,
      {
        defaultFamilyId: familyId,
        updatedAt: nowField(),
      },
      { merge: true },
    );
  });

  return { familyId };
});
