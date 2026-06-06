import { Injectable, inject } from '@angular/core';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
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
  Currency,
  RecurringFrequency,
  RecurringPayment,
} from '../../shared/models/domain.models';

export interface CreateRecurringPaymentInput {
  name: string;
  expectedAmount: number;
  frequency: Exclude<RecurringFrequency, 'custom'>;
  nextDueDate: Date;
  suggestedAccountId?: string;
  suggestedCategoryId?: string;
  currency: Currency;
}

export interface MarkRecurringPaymentPaidInput {
  recurringPaymentId: string;
  amount: number;
  accountId: string;
  categoryId: string;
  paymentDate: string;
}

@Injectable({ providedIn: 'root' })
export class RecurringPaymentService {
  private readonly auth = inject(AuthService);
  private readonly familyContext = inject(FamilyContextService);

  async listActive(): Promise<RecurringPayment[]> {
    const familyId = this.requireFamilyId();
    const snapshot = await getDocs(
      query(
        collection(firestore, `families/${familyId}/recurringPayments`),
        where('status', '==', 'active'),
      ),
    );
    return snapshot.docs
      .map((item) => item.data() as RecurringPayment)
      .sort((left, right) => left.nextDueDate.toMillis() - right.nextDueDate.toMillis());
  }

  async getById(recurringPaymentId: string): Promise<RecurringPayment> {
    const familyId = this.requireFamilyId();
    const snapshot = await getDoc(
      doc(firestore, `families/${familyId}/recurringPayments/${recurringPaymentId}`),
    );
    if (!snapshot.exists()) {
      throw new Error('El pago recurrente no existe.');
    }
    return snapshot.data() as RecurringPayment;
  }

  async create(input: CreateRecurringPaymentInput): Promise<string> {
    const user = this.auth.currentUser();
    const familyId = this.requireFamilyId();
    if (!user) {
      throw new Error('Debes iniciar sesion para crear un pago recurrente.');
    }

    const recurringRef = doc(
      collection(firestore, `families/${familyId}/recurringPayments`),
    );
    await setDoc(recurringRef, {
      id: recurringRef.id,
      familyId,
      name: input.name.trim(),
      expectedAmount: input.expectedAmount,
      frequency: input.frequency,
      nextDueDate: Timestamp.fromDate(input.nextDueDate),
      suggestedAccountId: input.suggestedAccountId || null,
      suggestedCategoryId: input.suggestedCategoryId || null,
      currency: input.currency,
      createdByUserId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
      lastPaidAt: null,
    });

    return recurringRef.id;
  }

  async markAsPaid(input: MarkRecurringPaymentPaidInput): Promise<string> {
    const familyId = this.requireFamilyId();
    const callable = httpsCallable<
      MarkRecurringPaymentPaidInput & { familyId: string },
      { transactionId: string }
    >(functions, 'markRecurringPaymentAsPaid');
    const result = await callable({ ...input, familyId });
    return result.data.transactionId;
  }

  private requireFamilyId(): string {
    const familyId = this.familyContext.selectedFamilyId();
    if (!familyId) {
      throw new Error('Selecciona una familia para continuar.');
    }
    return familyId;
  }
}
