import { Injectable, inject } from '@angular/core';
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { AuthService } from '../../core/auth/auth.service';
import { FamilyContextService } from '../../core/family-context/family-context.service';
import { firestore, functions } from '../../core/firebase/firebase';
import {
  FamilyMember,
  Invitation,
  MemberRole,
} from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class FamilyMembersService {
  private readonly auth = inject(AuthService);
  private readonly familyContext = inject(FamilyContextService);

  async listMembers(): Promise<FamilyMember[]> {
    const familyId = this.requireFamilyId();
    const snapshot = await getDocs(collection(firestore, `families/${familyId}/members`));
    return snapshot.docs
      .map((item) => item.data() as FamilyMember)
      .sort((left, right) => left.displayName.localeCompare(right.displayName));
  }

  async listPendingInvitations(): Promise<Invitation[]> {
    const familyId = this.requireFamilyId();
    const snapshot = await getDocs(
      query(
        collection(firestore, `families/${familyId}/invitations`),
        where('status', '==', 'pending'),
      ),
    );
    return snapshot.docs.map((item) => item.data() as Invitation);
  }

  async createInvitation(email: string, role: Exclude<MemberRole, 'owner'>): Promise<Invitation> {
    const user = this.auth.currentUser();
    const familyId = this.requireFamilyId();
    if (!user) {
      throw new Error('Debes iniciar sesion para invitar miembros.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const members = await getDocs(
      collection(firestore, `families/${familyId}/members`),
    );
    const isExistingMember = members.docs.some((member) => {
      const data = member.data() as FamilyMember;
      return data.status === 'active' && data.email.trim().toLowerCase() === normalizedEmail;
    });
    if (isExistingMember) {
      throw new Error('Ese correo ya pertenece a un miembro activo.');
    }

    const duplicates = await getDocs(
      query(
        collection(firestore, `families/${familyId}/invitations`),
        where('email', '==', normalizedEmail),
        where('status', '==', 'pending'),
      ),
    );
    if (!duplicates.empty) {
      throw new Error('Ya existe una invitacion pendiente para ese correo.');
    }

    const invitationRef = doc(
      collection(firestore, `families/${familyId}/invitations`),
    );
    const invitation: Invitation = {
      id: invitationRef.id,
      familyId,
      email: normalizedEmail,
      role,
      invitedByUserId: user.uid,
      status: 'pending',
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
      acceptedAt: null,
    };
    await setDoc(invitationRef, {
      ...invitation,
      createdAt: serverTimestamp(),
    });
    return invitation;
  }

  async acceptInvitation(familyId: string, invitationId: string): Promise<string> {
    const callable = httpsCallable<
      { familyId: string; invitationId: string },
      { familyId: string }
    >(functions, 'acceptInvitation');
    const result = await callable({ familyId, invitationId });
    return result.data.familyId;
  }

  invitationUrl(invitation: Invitation): string {
    const params = new URLSearchParams({
      familyId: invitation.familyId,
      invitationId: invitation.id,
    });
    return `${window.location.origin}/accept-invitation?${params.toString()}`;
  }

  private requireFamilyId(): string {
    const familyId = this.familyContext.selectedFamilyId();
    if (!familyId) {
      throw new Error('Selecciona una familia para continuar.');
    }
    return familyId;
  }
}
