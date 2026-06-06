import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { AuthService } from '../../core/auth/auth.service';
import { FamilyContextService } from '../../core/family-context/family-context.service';
import { firestore } from '../../core/firebase/firebase';
import { Account, AccountType, Currency } from '../../shared/models/domain.models';

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  initialBalance: number;
  currency: Currency;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly auth = inject(AuthService);
  private readonly familyContext = inject(FamilyContextService);

  async listActive(): Promise<Account[]> {
    const familyId = this.requireFamilyId();
    const snapshot = await getDocs(
      query(collection(firestore, `families/${familyId}/accounts`), where('status', '==', 'active')),
    );

    return snapshot.docs
      .map((account) => account.data() as Account)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async create(input: CreateAccountInput): Promise<string> {
    const user = this.auth.currentUser();
    const familyId = this.requireFamilyId();

    if (!user) {
      throw new Error('Debes iniciar sesion para crear una cuenta.');
    }

    const accountRef = doc(collection(firestore, `families/${familyId}/accounts`));
    await setDoc(accountRef, {
      id: accountRef.id,
      familyId,
      name: input.name.trim(),
      type: input.type,
      initialBalance: input.initialBalance,
      currentBalance: input.initialBalance,
      currency: input.currency,
      createdByUserId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
    });

    return accountRef.id;
  }

  private requireFamilyId(): string {
    const familyId = this.familyContext.selectedFamilyId();
    if (!familyId) {
      throw new Error('Selecciona una familia para continuar.');
    }
    return familyId;
  }
}
