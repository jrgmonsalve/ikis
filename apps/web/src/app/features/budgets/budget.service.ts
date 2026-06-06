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

import { AuthService } from '../../core/auth/auth.service';
import { FamilyContextService } from '../../core/family-context/family-context.service';
import { firestore } from '../../core/firebase/firebase';
import {
  Budget,
  BudgetPeriodType,
  Currency,
  Transaction,
} from '../../shared/models/domain.models';
import {
  BudgetProgress,
  calculateBudgetProgress,
} from '../../shared/utils/budget-calculations';

export interface BudgetWithProgress {
  budget: Budget;
  progress: BudgetProgress;
}

export interface CreateBudgetInput {
  name: string;
  categoryId: string;
  plannedAmount: number;
  periodType: BudgetPeriodType;
  startDate: Date;
  endDate: Date;
  currency: Currency;
  month?: number;
  year?: number;
}

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly auth = inject(AuthService);
  private readonly familyContext = inject(FamilyContextService);

  async listWithProgress(): Promise<BudgetWithProgress[]> {
    const familyId = this.requireFamilyId();
    const [budgetsSnapshot, transactionsSnapshot] = await Promise.all([
      getDocs(
        query(collection(firestore, `families/${familyId}/budgets`), where('status', '==', 'active')),
      ),
      getDocs(
        query(
          collection(firestore, `families/${familyId}/transactions`),
          where('status', '==', 'active'),
        ),
      ),
    ]);

    const transactions = transactionsSnapshot.docs.map(
      (transaction) => transaction.data() as Transaction,
    );

    return budgetsSnapshot.docs
      .map((budgetSnapshot) => budgetSnapshot.data() as Budget)
      .map((budget) => ({
        budget,
        progress: calculateBudgetProgress(budget, transactions),
      }))
      .sort((left, right) => left.budget.endDate.toMillis() - right.budget.endDate.toMillis());
  }

  async create(input: CreateBudgetInput): Promise<string> {
    const user = this.auth.currentUser();
    const familyId = this.requireFamilyId();
    if (!user) {
      throw new Error('Debes iniciar sesion para crear un presupuesto.');
    }

    const existingSnapshot = await getDocs(
      query(
        collection(firestore, `families/${familyId}/budgets`),
        where('categoryId', '==', input.categoryId),
        where('status', '==', 'active'),
      ),
    );
    const startMillis = input.startDate.getTime();
    const endMillis = input.endDate.getTime();
    const duplicate = existingSnapshot.docs.some((item) => {
      const existing = item.data() as Budget;
      return (
        existing.startDate.toMillis() === startMillis &&
        existing.endDate.toMillis() === endMillis
      );
    });

    if (duplicate) {
      throw new Error('Ya existe un presupuesto activo para esa categoria y periodo.');
    }

    const budgetRef = doc(collection(firestore, `families/${familyId}/budgets`));
    await setDoc(budgetRef, {
      id: budgetRef.id,
      familyId,
      name: input.name.trim(),
      categoryId: input.categoryId,
      plannedAmount: input.plannedAmount,
      spentAmount: 0,
      remainingAmount: input.plannedAmount,
      percentageUsed: 0,
      periodType: input.periodType,
      month: input.month ?? null,
      year: input.year ?? null,
      startDate: Timestamp.fromDate(input.startDate),
      endDate: Timestamp.fromDate(input.endDate),
      currency: input.currency,
      createdByUserId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
    });

    return budgetRef.id;
  }

  async getById(budgetId: string): Promise<Budget> {
    const familyId = this.requireFamilyId();
    const docRef = doc(firestore, `families/${familyId}/budgets/${budgetId}`);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('Presupuesto no encontrado.');
    }
    return snap.data() as Budget;
  }

  async update(budgetId: string, input: CreateBudgetInput): Promise<void> {
    const user = this.auth.currentUser();
    const familyId = this.requireFamilyId();
    if (!user) {
      throw new Error('Debes iniciar sesion para actualizar un presupuesto.');
    }

    const existingSnapshot = await getDocs(
      query(
        collection(firestore, `families/${familyId}/budgets`),
        where('categoryId', '==', input.categoryId),
        where('status', '==', 'active'),
      ),
    );
    const startMillis = input.startDate.getTime();
    const endMillis = input.endDate.getTime();
    const duplicate = existingSnapshot.docs.some((item) => {
      if (item.id === budgetId) return false;
      const existing = item.data() as Budget;
      return (
        existing.startDate.toMillis() === startMillis &&
        existing.endDate.toMillis() === endMillis
      );
    });

    if (duplicate) {
      throw new Error('Ya existe otro presupuesto activo para esa categoria y periodo.');
    }

    const budgetRef = doc(firestore, `families/${familyId}/budgets/${budgetId}`);
    await updateDoc(budgetRef, {
      name: input.name.trim(),
      categoryId: input.categoryId,
      plannedAmount: input.plannedAmount,
      remainingAmount: input.plannedAmount - (input.plannedAmount * 0), // spentAmount calculation is dynamic, remainingAmount is just calculated in client usually, but let's keep model shape
      periodType: input.periodType,
      month: input.month ?? null,
      year: input.year ?? null,
      startDate: Timestamp.fromDate(input.startDate),
      endDate: Timestamp.fromDate(input.endDate),
      currency: input.currency,
      updatedAt: serverTimestamp(),
    });
  }

  private requireFamilyId(): string {
    const familyId = this.familyContext.selectedFamilyId();
    if (!familyId) {
      throw new Error('Selecciona una familia para continuar.');
    }
    return familyId;
  }
}
