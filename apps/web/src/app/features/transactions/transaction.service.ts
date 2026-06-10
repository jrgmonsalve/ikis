import { Injectable, inject } from '@angular/core';
import { httpsCallable } from 'firebase/functions';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { FamilyContextService } from '../../core/family-context/family-context.service';
import { functions, firestore } from '../../core/firebase/firebase';
import { Transaction } from '../../shared/models/domain.models';

export interface ExpenseIncomeInput {
  amount: number;
  accountId: string;
  categoryId: string;
  subcategoryId?: string | null;
  description?: string;
  transactionDate: string;
}

export interface TransferInput {
  amount: number;
  sourceAccountId: string;
  destinationAccountId: string;
  description?: string;
  transactionDate: string;
}

export type UpdateTransactionInput = (ExpenseIncomeInput | TransferInput) & {
  transactionId: string;
};

interface TransactionResponse {
  transactionId: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly familyContext = inject(FamilyContextService);

  async createExpense(input: ExpenseIncomeInput): Promise<string> {
    return this.call('createExpense', input);
  }

  async createIncome(input: ExpenseIncomeInput): Promise<string> {
    return this.call('createIncome', input);
  }

  async createTransfer(input: TransferInput): Promise<string> {
    return this.call('createTransfer', input);
  }

  async updateTransaction(input: UpdateTransactionInput): Promise<string> {
    return this.call('updateTransaction', input);
  }

  private async call(
    functionName: 'createExpense' | 'createIncome' | 'createTransfer' | 'updateTransaction',
    input: ExpenseIncomeInput | TransferInput | UpdateTransactionInput,
  ): Promise<string> {
    const familyId = this.requireFamilyId();
    const callable = httpsCallable<
      (ExpenseIncomeInput | TransferInput | UpdateTransactionInput) & { familyId: string },
      TransactionResponse
    >(functions, functionName);
    const response = await callable({ ...input, familyId });
    return response.data.transactionId;
  }

  async getTransactionById(transactionId: string): Promise<Transaction> {
    const familyId = this.requireFamilyId();
    const docRef = doc(firestore, `families/${familyId}/transactions/${transactionId}`);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('Movimiento no encontrado.');
    }
    return snap.data() as Transaction;
  }

  async cancelTransaction(transaction: Transaction): Promise<void> {
    const familyId = this.requireFamilyId();
    const callable = httpsCallable<{ familyId: string; transactionId: string }, TransactionResponse>(
      functions,
      'cancelTransaction',
    );
    await callable({ familyId, transactionId: transaction.id });
  }

  async listRecent(limitCount: number): Promise<Transaction[]> {
    const familyId = this.requireFamilyId();
    const snapshot = await getDocs(
      query(
        collection(firestore, `families/${familyId}/transactions`),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      ),
    );
    return snapshot.docs.map((doc) => doc.data() as Transaction);
  }

  async listByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    const familyId = this.requireFamilyId();
    const snapshot = await getDocs(
      query(
        collection(firestore, `families/${familyId}/transactions`),
        where('status', '==', 'active'),
        where('transactionDate', '>=', Timestamp.fromDate(startDate)),
        where('transactionDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('transactionDate', 'desc'),
      ),
    );
    return snapshot.docs
      .map((doc) => doc.data() as Transaction)
      .sort(
        (left, right) =>
          (right.createdAt?.toMillis() ?? right.transactionDate.toMillis()) -
          (left.createdAt?.toMillis() ?? left.transactionDate.toMillis()),
      );
  }

  private requireFamilyId(): string {
    const familyId = this.familyContext.selectedFamilyId();
    if (!familyId) {
      throw new Error('Selecciona una familia para continuar.');
    }
    return familyId;
  }
}
