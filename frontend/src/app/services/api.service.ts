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

export type AccountType = 'cash' | 'checking' | 'savings' | 'credit';
export type CategoryKind = 'expense' | 'income';
export type TransactionType = 'expense' | 'income' | 'transfer';

export interface AccountDto {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccountInputDto {
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
}

export interface CategoryDto {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInputDto {
  name: string;
  kind: CategoryKind;
  color: string;
}

export interface TransactionDto {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  transactionDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionInputDto {
  type: TransactionType;
  amount: number;
  categoryId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  transactionDate: string;
  description?: string;
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

  listAccounts(): Observable<AccountDto[]> {
    return this.http.get<AccountDto[]>(`${this.baseUrl}/accounts`);
  }

  createAccount(input: AccountInputDto): Observable<AccountDto> {
    return this.http.post<AccountDto>(`${this.baseUrl}/accounts`, input);
  }

  updateAccount(id: string, input: AccountInputDto): Observable<AccountDto> {
    return this.http.put<AccountDto>(`${this.baseUrl}/accounts/${id}`, input);
  }

  deleteAccount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/accounts/${id}`);
  }

  listCategories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(`${this.baseUrl}/categories`);
  }

  createCategory(input: CategoryInputDto): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(`${this.baseUrl}/categories`, input);
  }

  updateCategory(id: string, input: CategoryInputDto): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.baseUrl}/categories/${id}`, input);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }

  listTransactions(): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(`${this.baseUrl}/transactions`);
  }

  createTransaction(input: TransactionInputDto): Observable<TransactionDto> {
    return this.http.post<TransactionDto>(`${this.baseUrl}/transactions`, input);
  }
}
