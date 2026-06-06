import { Injectable, inject } from '@angular/core';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { AuthService } from '../../core/auth/auth.service';
import { FamilyContextService } from '../../core/family-context/family-context.service';
import { firestore } from '../../core/firebase/firebase';
import { UserLanguage, UserProfile } from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly auth = inject(AuthService);
  private readonly familyContext = inject(FamilyContextService);

  async getProfile(): Promise<UserProfile> {
    const user = this.auth.currentUser();
    if (!user) {
      throw new Error('Debes iniciar sesion.');
    }
    const snapshot = await getDoc(doc(firestore, `users/${user.uid}`));
    if (!snapshot.exists()) {
      throw new Error('No fue posible cargar el perfil.');
    }
    return snapshot.data() as UserProfile;
  }

  async updateLanguage(preferredLanguage: UserLanguage): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) {
      throw new Error('Debes iniciar sesion.');
    }
    await updateDoc(doc(firestore, `users/${user.uid}`), {
      preferredLanguage,
      updatedAt: serverTimestamp(),
    });
  }

  async updateFamilyName(name: string): Promise<void> {
    const familyId = this.familyContext.selectedFamilyId();
    if (!familyId) {
      throw new Error('Selecciona una familia.');
    }
    await updateDoc(doc(firestore, `families/${familyId}`), {
      name: name.trim(),
      updatedAt: serverTimestamp(),
    });
  }
}
