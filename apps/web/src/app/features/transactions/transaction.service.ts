import { Injectable, inject } from '@angular/core';
import { httpsCallable } from 'firebase/functions';
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  increment,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

import { FamilyContextService } from '../../core/family-context/family-context.service';
import { functions, firestore } from '../../core/firebase/firebase';
import { Transaction } from '../../shared/models/domain.models';

export interface ExpenseIncomeInput {
  amount: number;
  accountId: string;
  categoryId: string;
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

  private async call(
    functionName: 'createExpense' | 'createIncome' | 'createTransfer',
    input: ExpenseIncomeInput | TransferInput,
  ): Promise<string> {
    const familyId = this.familyContext.selectedFamilyId();
    if (!familyId) {
      throw new Error('Selecciona una familia para continuar.');
    }

    const callable = httpsCallable<
      (ExpenseIncomeInput | TransferInput) & { familyId: string },
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
    await runTransaction(firestore, async (tx) => {
      const txRef = doc(firestore, `families/${familyId}/transactions/${transaction.id}`);
      const accountsToUpdate: { ref: any; balanceDelta: number }[] = [];

      if (transaction.type === 'expense') {
        if (!transaction.accountId) throw new Error('Transaction account ID missing.');
        const accountRef = doc(firestore, `families/${familyId}/accounts/${transaction.accountId}`);
        const accountSnap = await tx.get(accountRef);
        if (!accountSnap.exists) throw new Error('Account not found');
        const account = accountSnap.data() as any;
        const delta = account.type === 'credit_card' ? -transaction.amount : transaction.amount;
        accountsToUpdate.push({ ref: accountRef, balanceDelta: delta });
      } else if (transaction.type === 'income') {
        if (!transaction.accountId) throw new Error('Transaction account ID missing.');
        const accountRef = doc(firestore, `families/${familyId}/accounts/${transaction.accountId}`);
        const accountSnap = await tx.get(accountRef);
        if (!accountSnap.exists) throw new Error('Account not found');
        const account = accountSnap.data() as any;
        const delta = account.type === 'credit_card' ? transaction.amount : -transaction.amount;
        accountsToUpdate.push({ ref: accountRef, balanceDelta: delta });
      } else if (transaction.type === 'transfer') {
        if (!transaction.sourceAccountId || !transaction.destinationAccountId) {
          throw new Error('Transfer accounts missing.');
        }
        const srcRef = doc(firestore, `families/${familyId}/accounts/${transaction.sourceAccountId}`);
        const destRef = doc(firestore, `families/${familyId}/accounts/${transaction.destinationAccountId}`);
        const [srcSnap, destSnap] = await Promise.all([tx.get(srcRef), tx.get(destRef)]);
        if (!srcSnap.exists || !destSnap.exists) throw new Error('Accounts not found');
        const srcAcc = srcSnap.data() as any;
        const destAcc = destSnap.data() as any;
        const srcDelta = srcAcc.type === 'credit_card' ? -transaction.amount : transaction.amount;
        const destDelta = destAcc.type === 'credit_card' ? transaction.amount : -transaction.amount;
        accountsToUpdate.push({ ref: srcRef, balanceDelta: srcDelta });
        accountsToUpdate.push({ ref: destRef, balanceDelta: destDelta });
      }

      tx.update(txRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      for (const acc of accountsToUpdate) {
        tx.update(acc.ref, {
          currentBalance: increment(acc.balanceDelta),
          updatedAt: serverTimestamp(),
        });
      }
    });
  }

  async listRecent(limitCount: number): Promise<Transaction[]> {
    const familyId = this.requireFamilyId();
    const snapshot = await getDocs(
      query(
        collection(firestore, `families/${familyId}/transactions`),
        where('status', '==', 'active'),
        orderBy('transactionDate', 'desc'),
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
    return snapshot.docs.map((doc) => doc.data() as Transaction);
  }

  private requireFamilyId(): string {
    const familyId = this.familyContext.selectedFamilyId();
    if (!familyId) {
      throw new Error('Selecciona una familia para continuar.');
    }
    return familyId;
  }
}
