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
  updateDoc,
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

  async update(id: string, input: Partial<CreateRecurringPaymentInput>): Promise<void> {
    const familyId = this.requireFamilyId();
    const docRef = doc(firestore, `families/${familyId}/recurringPayments/${id}`);
    const data: any = {
      updatedAt: serverTimestamp(),
    };
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.expectedAmount !== undefined) data.expectedAmount = input.expectedAmount;
    if (input.frequency !== undefined) data.frequency = input.frequency;
    if (input.nextDueDate !== undefined) data.nextDueDate = Timestamp.fromDate(input.nextDueDate);
    if (input.suggestedAccountId !== undefined) data.suggestedAccountId = input.suggestedAccountId || null;
    if (input.suggestedCategoryId !== undefined) data.suggestedCategoryId = input.suggestedCategoryId || null;
    if (input.currency !== undefined) data.currency = input.currency;

    await updateDoc(docRef, data);
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
