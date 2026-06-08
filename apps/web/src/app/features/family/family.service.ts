import { Injectable, inject } from '@angular/core';
import { collectionGroup, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { AuthService } from '../../core/auth/auth.service';
import { FamilyContextService } from '../../core/family-context/family-context.service';
import { firestore, functions } from '../../core/firebase/firebase';
import { Currency, Family, FamilyMember } from '../../shared/models/domain.models';

export interface UserFamily {
  family: Family;
  membership: FamilyMember;
}

interface CreateFamilyResponse {
  familyId: string;
}

function normalizeFamilyName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-CO');
}

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private readonly auth = inject(AuthService);
  private readonly familyContext = inject(FamilyContextService);

  async createFamily(name: string, mainCurrency: Currency): Promise<string> {
    const user = this.auth.currentUser();
    if (!user) {
      throw new Error('Debes iniciar sesion para crear una familia.');
    }

    const normalizedName = normalizeFamilyName(name);
    const existingFamily = (await this.listCurrentUserFamilies()).find(
      (item) => normalizeFamilyName(item.family.name) === normalizedName,
    );
    if (existingFamily) {
      this.familyContext.selectFamily(existingFamily.family.id);
      return existingFamily.family.id;
    }

    const createFamilyFn = httpsCallable<{ name: string; mainCurrency: Currency }, CreateFamilyResponse>(
      functions,
      'createFamily',
    );
    const result = await createFamilyFn({ name: name.trim(), mainCurrency });
    const familyId = result.data.familyId;

    this.familyContext.selectFamily(familyId);
    return familyId;
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
        const familySnapshot = await getDoc(doc(firestore, `families/${membership.familyId}`));
        const family = familySnapshot.exists() ? (familySnapshot.data() as Family) : undefined;
        return family ? { family, membership } : null;
      }),
    );

    return families.filter((item): item is UserFamily => item !== null);
  }
}
