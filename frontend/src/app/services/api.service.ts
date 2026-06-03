import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ExpenseDto {
  id: string;
  amount: number;
  category: string;
  description?: string;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listExpenses(): Observable<ExpenseDto[]> {
    return this.http.get<ExpenseDto[]>(`${this.baseUrl}/expenses`);
  }
}
