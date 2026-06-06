import { Injectable, inject } from '@angular/core';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { FamilyContextService } from '../../core/family-context/family-context.service';
import { firestore } from '../../core/firebase/firebase';
import { Transaction } from '../../shared/models/domain.models';
import {
  FinancialSummary,
  calculateFinancialSummary,
} from '../../shared/utils/report-calculations';

export interface PeriodReport {
  transactions: Transaction[];
  summary: FinancialSummary;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly familyContext = inject(FamilyContextService);

  async load(startDate: Date, endDate: Date): Promise<PeriodReport> {
    const familyId = this.familyContext.selectedFamilyId();
    if (!familyId) {
      throw new Error('Selecciona una familia para continuar.');
    }

    const snapshot = await getDocs(
      query(
        collection(firestore, `families/${familyId}/transactions`),
        where('status', '==', 'active'),
      ),
    );
    const start = startDate.getTime();
    const end = endDate.getTime();
    const transactions = snapshot.docs
      .map((item) => item.data() as Transaction)
      .filter((transaction) => {
        const date = transaction.transactionDate.toMillis();
        return date >= start && date <= end;
      })
      .sort(
        (left, right) =>
          right.transactionDate.toMillis() - left.transactionDate.toMillis(),
      );

    return {
      transactions,
      summary: calculateFinancialSummary(transactions),
    };
  }
}
