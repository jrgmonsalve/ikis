import { Injectable, inject } from '@angular/core';
import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

import { AuthService } from '../../core/auth/auth.service';
import { FamilyContextService } from '../../core/family-context/family-context.service';
import { firestore } from '../../core/firebase/firebase';
import { Currency, Family, FamilyMember } from '../../shared/models/domain.models';

export interface UserFamily {
  family: Family;
  membership: FamilyMember;
}

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private readonly auth = inject(AuthService);
  private readonly familyContext = inject(FamilyContextService);

  async createFamily(name: string, mainCurrency: Currency): Promise<string> {
    const user = this.auth.currentUser();
    if (!user) {
      throw new Error('User must be authenticated to create a family.');
    }

    const familyRef = doc(collection(firestore, 'families'));
    const memberRef = doc(firestore, `families/${familyRef.id}/members/${user.uid}`);
    const userRef = doc(firestore, `users/${user.uid}`);
    const batch = writeBatch(firestore);

    batch.set(familyRef, {
      id: familyRef.id,
      name: name.trim(),
      mainCurrency,
      ownerUserId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
    });
    batch.set(memberRef, {
      id: user.uid,
      familyId: familyRef.id,
      userId: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? user.email ?? 'IKIS user',
      role: 'owner',
      joinedAt: serverTimestamp(),
      status: 'active',
    });
    batch.update(userRef, {
      defaultFamilyId: familyRef.id,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    this.familyContext.selectFamily(familyRef.id);
    return familyRef.id;
  }

  async listCurrentUserFamilies(): Promise<UserFamily[]> {
    const user = this.auth.currentUser();
    if (!user) {
      return [];
    }

    const memberships = await getDocs(
      query(collectionGroup(firestore, 'members'), where('userId', '==', user.uid), where('status', '==', 'active')),
    );

    const families = await Promise.all(
      memberships.docs.map(async (membershipDoc) => {
        const membership = membershipDoc.data() as FamilyMember;
        const familyDocs = await getDocs(
          query(collection(firestore, 'families'), where('id', '==', membership.familyId)),
        );
        const family = familyDocs.docs[0]?.data() as Family | undefined;
        return family ? { family, membership } : null;
      }),
    );

    return families.filter((item): item is UserFamily => item !== null);
  }
}
