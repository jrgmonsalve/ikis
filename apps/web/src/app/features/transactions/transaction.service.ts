import { Injectable, inject } from '@angular/core';
import { httpsCallable } from 'firebase/functions';

import { FamilyContextService } from '../../core/family-context/family-context.service';
import { functions } from '../../core/firebase/firebase';

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
}
