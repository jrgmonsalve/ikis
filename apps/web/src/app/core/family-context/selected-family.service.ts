import { Injectable, inject } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';

import { Family, FamilyMember } from '../../shared/models/domain.models';
import { AuthService } from '../auth/auth.service';
import { firestore } from '../firebase/firebase';
import { FamilyContextService } from './family-context.service';

export interface SelectedFamilyData {
  family: Family;
  membership: FamilyMember;
}

@Injectable({ providedIn: 'root' })
export class SelectedFamilyService {
  private readonly auth = inject(AuthService);
  private readonly context = inject(FamilyContextService);

  async load(): Promise<SelectedFamilyData> {
    const user = this.auth.currentUser();
    const familyId = this.context.selectedFamilyId();

    if (!user || !familyId) {
      throw new Error('Selecciona una familia para continuar.');
    }

    const [familySnapshot, membershipSnapshot] = await Promise.all([
      getDoc(doc(firestore, `families/${familyId}`)),
      getDoc(doc(firestore, `families/${familyId}/members/${user.uid}`)),
    ]);

    if (!familySnapshot.exists() || !membershipSnapshot.exists()) {
      throw new Error('No fue posible cargar la familia seleccionada.');
    }

    return {
      family: familySnapshot.data() as Family,
      membership: membershipSnapshot.data() as FamilyMember,
    };
  }
}
