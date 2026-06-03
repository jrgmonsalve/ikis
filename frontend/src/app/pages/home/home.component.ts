import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  AccountDto,
  AccountInputDto,
  AccountType,
  ApiService,
  CategoryDto,
  CategoryInputDto,
  CategoryKind,
  TransactionDto,
  TransactionInputDto,
  TransactionType
} from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

type ActivePanel = 'dashboard' | 'transaction' | 'account' | 'category';

interface AccountForm {
  id?: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
}

interface CategoryForm {
  id?: string;
  name: string;
  kind: CategoryKind;
  color: string;
}

interface TransactionForm {
  type: TransactionType;
  amount: number;
  categoryId: string;
  fromAccountId: string;
  toAccountId: string;
  transactionDate: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="min-h-screen bg-slate-100 pb-28 text-slate-950">
      <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-teal-700">Ikis Expense Control</p>
            <h1 class="text-xl font-semibold">Money dashboard</h1>
          </div>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            (click)="auth.isAuthenticated() ? signOut() : signIn()"
          >
            {{ auth.isAuthenticated() ? 'Sign out' : 'Sign in' }}
          </button>
        </div>
      </header>

      <section class="mx-auto max-w-6xl px-4 py-5">
        @if (message()) {
          <div class="mb-4 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900">
            {{ message() }}
          </div>
        }

        @if (error()) {
          <div class="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {{ error() }}
          </div>
        }

        @if (activePanel() === 'dashboard') {
          <section class="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div class="space-y-4">
              <div class="rounded-lg bg-teal-800 px-5 py-5 text-white shadow-sm">
                <p class="text-sm font-medium text-teal-100">Available balance</p>
                <p class="mt-2 text-4xl font-semibold">{{ formatMoney(totalBalance()) }}</p>
                <p class="mt-2 text-sm text-teal-100">{{ accounts().length }} accounts available</p>
              </div>

              <section>
                <div class="mb-3 flex items-center justify-between">
                  <h2 class="text-lg font-semibold">Accounts</h2>
                  <button class="text-sm font-semibold text-teal-700" type="button" (click)="openAccountPanel()">Add account</button>
                </div>
                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  @for (account of accounts(); track account.id) {
                    <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <h3 class="font-semibold">{{ account.name }}</h3>
                          <p class="text-sm capitalize text-slate-500">{{ account.type }}</p>
                        </div>
                        <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {{ account.currency }}
                        </span>
                      </div>
                      <p class="mt-4 text-2xl font-semibold">{{ formatMoney(account.balance, account.currency) }}</p>
                      <div class="mt-4 flex gap-2">
                        <button class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold" type="button" (click)="editAccount(account)">
                          Edit
                        </button>
                        <button class="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700" type="button" (click)="deleteAccount(account.id)">
                          Delete
                        </button>
                      </div>
                    </article>
                  } @empty {
                    <p class="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                      Create your first account to start tracking balances.
                    </p>
                  }
                </div>
              </section>
            </div>

            <aside class="space-y-4">
              <section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div class="mb-3 flex items-center justify-between">
                  <h2 class="font-semibold">Recent transactions</h2>
                  <button class="text-sm font-semibold text-teal-700" type="button" (click)="openTransactionPanel()">New</button>
                </div>
                <div class="space-y-3">
                  @for (transaction of transactions().slice(0, 8); track transaction.id) {
                    <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p class="font-medium">{{ transaction.description || transaction.type }}</p>
                        <p class="text-xs text-slate-500">
                          {{ transaction.transactionDate }} · {{ describeTransaction(transaction) }}
                        </p>
                      </div>
                      <p [ngClass]="transaction.type === 'income' ? 'text-emerald-700' : transaction.type === 'expense' ? 'text-rose-700' : 'text-slate-700'" class="font-semibold">
                        {{ transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : '' }}{{ formatMoney(transaction.amount) }}
                      </p>
                    </div>
                  } @empty {
                    <p class="text-sm text-slate-600">No transactions yet.</p>
                  }
                </div>
              </section>

              <section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div class="mb-3 flex items-center justify-between">
                  <h2 class="font-semibold">Categories</h2>
                  <button class="text-sm font-semibold text-teal-700" type="button" (click)="openCategoryPanel()">Add</button>
                </div>
                <div class="flex flex-wrap gap-2">
                  @for (category of categories(); track category.id) {
                    <span class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
                      <span class="h-2.5 w-2.5 rounded-full" [style.background]="category.color"></span>
                      {{ category.name }}
                    </span>
                  } @empty {
                    <p class="text-sm text-slate-600">Create categories for income and expenses.</p>
                  }
                </div>
              </section>
            </aside>
          </section>
        }

        @if (activePanel() === 'transaction') {
          <section class="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-lg font-semibold">Register transaction</h2>
            <form class="mt-5 grid gap-4" (ngSubmit)="submitTransaction()">
              <label class="grid gap-2 text-sm font-medium">
                Type
                <select class="rounded-md border border-slate-300 px-3 py-2" name="transactionType" [(ngModel)]="transactionForm.type">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </label>

              <div class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-2 text-sm font-medium">
                  Amount
                  <input class="rounded-md border border-slate-300 px-3 py-2" name="amount" type="number" min="0.01" step="0.01" [(ngModel)]="transactionForm.amount" required>
                </label>
                <label class="grid gap-2 text-sm font-medium">
                  Date
                  <input class="rounded-md border border-slate-300 px-3 py-2" name="transactionDate" type="date" [(ngModel)]="transactionForm.transactionDate" required>
                </label>
              </div>

              @if (transactionForm.type !== 'income') {
                <label class="grid gap-2 text-sm font-medium">
                  Origin account
                  <select class="rounded-md border border-slate-300 px-3 py-2" name="fromAccountId" [(ngModel)]="transactionForm.fromAccountId">
                    <option value="">Select account</option>
                    @for (account of accounts(); track account.id) {
                      <option [value]="account.id">{{ account.name }} · {{ formatMoney(account.balance, account.currency) }}</option>
                    }
                  </select>
                </label>
              }

              @if (transactionForm.type !== 'expense') {
                <label class="grid gap-2 text-sm font-medium">
                  Destination account
                  <select class="rounded-md border border-slate-300 px-3 py-2" name="toAccountId" [(ngModel)]="transactionForm.toAccountId">
                    <option value="">Select account</option>
                    @for (account of accounts(); track account.id) {
                      <option [value]="account.id">{{ account.name }} · {{ formatMoney(account.balance, account.currency) }}</option>
                    }
                  </select>
                </label>
              }

              @if (transactionForm.type !== 'transfer') {
                <label class="grid gap-2 text-sm font-medium">
                  Category
                  <select class="rounded-md border border-slate-300 px-3 py-2" name="categoryId" [(ngModel)]="transactionForm.categoryId">
                    <option value="">Select category</option>
                    @for (category of filteredCategories(transactionForm.type); track category.id) {
                      <option [value]="category.id">{{ category.name }}</option>
                    }
                  </select>
                </label>
              }

              <label class="grid gap-2 text-sm font-medium">
                Description
                <textarea class="min-h-24 rounded-md border border-slate-300 px-3 py-2" name="description" [(ngModel)]="transactionForm.description"></textarea>
              </label>

              <button class="rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800" type="submit">
                Save transaction
              </button>
            </form>
          </section>
        }

        @if (activePanel() === 'account') {
          <section class="grid gap-4 lg:grid-cols-[420px_1fr]">
            <form class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" (ngSubmit)="submitAccount()">
              <h2 class="text-lg font-semibold">{{ accountForm.id ? 'Edit account' : 'Create account' }}</h2>
              <div class="mt-5 grid gap-4">
                <label class="grid gap-2 text-sm font-medium">
                  Name
                  <input class="rounded-md border border-slate-300 px-3 py-2" name="accountName" [(ngModel)]="accountForm.name" required>
                </label>
                <label class="grid gap-2 text-sm font-medium">
                  Type
                  <select class="rounded-md border border-slate-300 px-3 py-2" name="accountType" [(ngModel)]="accountForm.type">
                    <option value="cash">Cash</option>
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit</option>
                  </select>
                </label>
                <div class="grid gap-4 sm:grid-cols-2">
                  <label class="grid gap-2 text-sm font-medium">
                    Currency
                    <input class="rounded-md border border-slate-300 px-3 py-2 uppercase" name="currency" maxlength="3" [(ngModel)]="accountForm.currency" required>
                  </label>
                  <label class="grid gap-2 text-sm font-medium">
                    Balance
                    <input class="rounded-md border border-slate-300 px-3 py-2" name="balance" type="number" step="0.01" [(ngModel)]="accountForm.balance" required>
                  </label>
                </div>
                <div class="flex gap-2">
                  <button class="rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white" type="submit">
                    {{ accountForm.id ? 'Update' : 'Create' }}
                  </button>
                  <button class="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold" type="button" (click)="resetAccountForm()">
                    Clear
                  </button>
                </div>
              </div>
            </form>

            <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 class="text-lg font-semibold">Manage accounts</h2>
              <div class="mt-4 space-y-3">
                @for (account of accounts(); track account.id) {
                  <div class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                    <div>
                      <p class="font-semibold">{{ account.name }}</p>
                      <p class="text-sm capitalize text-slate-500">{{ account.type }} · {{ formatMoney(account.balance, account.currency) }}</p>
                    </div>
                    <div class="flex gap-2">
                      <button class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold" type="button" (click)="editAccount(account)">Edit</button>
                      <button class="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700" type="button" (click)="deleteAccount(account.id)">Delete</button>
                    </div>
                  </div>
                }
              </div>
            </section>
          </section>
        }

        @if (activePanel() === 'category') {
          <section class="grid gap-4 lg:grid-cols-[420px_1fr]">
            <form class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" (ngSubmit)="submitCategory()">
              <h2 class="text-lg font-semibold">{{ categoryForm.id ? 'Edit category' : 'Create category' }}</h2>
              <div class="mt-5 grid gap-4">
                <label class="grid gap-2 text-sm font-medium">
                  Name
                  <input class="rounded-md border border-slate-300 px-3 py-2" name="categoryName" [(ngModel)]="categoryForm.name" required>
                </label>
                <label class="grid gap-2 text-sm font-medium">
                  Kind
                  <select class="rounded-md border border-slate-300 px-3 py-2" name="categoryKind" [(ngModel)]="categoryForm.kind">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </label>
                <label class="grid gap-2 text-sm font-medium">
                  Color
                  <input class="h-11 rounded-md border border-slate-300 px-3 py-2" name="categoryColor" type="color" [(ngModel)]="categoryForm.color">
                </label>
                <div class="flex gap-2">
                  <button class="rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white" type="submit">
                    {{ categoryForm.id ? 'Update' : 'Create' }}
                  </button>
                  <button class="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold" type="button" (click)="resetCategoryForm()">
                    Clear
                  </button>
                </div>
              </div>
            </form>

            <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 class="text-lg font-semibold">Manage categories</h2>
              <div class="mt-4 space-y-3">
                @for (category of categories(); track category.id) {
                  <div class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                    <div class="flex items-center gap-3">
                      <span class="h-4 w-4 rounded-full" [style.background]="category.color"></span>
                      <div>
                        <p class="font-semibold">{{ category.name }}</p>
                        <p class="text-sm capitalize text-slate-500">{{ category.kind }}</p>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold" type="button" (click)="editCategory(category)">Edit</button>
                      <button class="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700" type="button" (click)="deleteCategory(category.id)">Delete</button>
                    </div>
                  </div>
                }
              </div>
            </section>
          </section>
        }
      </section>

      <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-3 py-2 shadow-lg">
        <div class="mx-auto grid max-w-2xl grid-cols-4 gap-2">
          @for (item of menuItems; track item.panel) {
            <button
              type="button"
              class="rounded-md px-2 py-2 text-xs font-semibold"
              [ngClass]="activePanel() === item.panel ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'"
              (click)="setPanel(item.panel)"
            >
              <span class="block text-lg leading-none">{{ item.icon }}</span>
              <span class="mt-1 block">{{ item.label }}</span>
            </button>
          }
        </div>
      </nav>
    </main>
  `
})
export class HomeComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  accounts = signal<AccountDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  transactions = signal<TransactionDto[]>([]);
  activePanel = signal<ActivePanel>('dashboard');
  message = signal('');
  error = signal('');

  totalBalance = computed(() => this.accounts().reduce((total, account) => total + account.balance, 0));

  menuItems: Array<{ panel: ActivePanel; label: string; icon: string }> = [
    { panel: 'dashboard', label: 'Home', icon: '⌂' },
    { panel: 'transaction', label: 'Move', icon: '+' },
    { panel: 'account', label: 'Account', icon: '$' },
    { panel: 'category', label: 'Category', icon: '◇' }
  ];

  accountForm: AccountForm = this.createEmptyAccountForm();
  categoryForm: CategoryForm = this.createEmptyCategoryForm();
  transactionForm: TransactionForm = this.createEmptyTransactionForm();

  async ngOnInit(): Promise<void> {
    await this.initializeAuth();
    this.loadDashboard();
  }

  signIn(): void {
    void this.auth.login().then(() => {
      if (this.auth.isAuthenticated()) {
        this.message.set('Signed in locally.');
      }
    });
  }

  signOut(): void {
    this.auth.logout();
    this.message.set('Signed out.');
  }

  setPanel(panel: ActivePanel): void {
    this.activePanel.set(panel);
    this.clearAlerts();
  }

  openTransactionPanel(): void {
    this.setPanel('transaction');
  }

  openAccountPanel(): void {
    this.resetAccountForm();
    this.setPanel('account');
  }

  openCategoryPanel(): void {
    this.resetCategoryForm();
    this.setPanel('category');
  }

  submitAccount(): void {
    this.clearAlerts();
    const input: AccountInputDto = {
      name: this.accountForm.name,
      type: this.accountForm.type,
      currency: this.accountForm.currency,
      balance: Number(this.accountForm.balance)
    };

    const request = this.accountForm.id
      ? this.api.updateAccount(this.accountForm.id, input)
      : this.api.createAccount(input);

    request.subscribe({
      next: () => {
        this.message.set(this.accountForm.id ? 'Account updated.' : 'Account created.');
        this.resetAccountForm();
        this.loadDashboard();
      },
      error: (error: unknown) => this.showRequestError(error)
    });
  }

  editAccount(account: AccountDto): void {
    this.accountForm = {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.balance
    };
    this.setPanel('account');
  }

  deleteAccount(id: string): void {
    this.clearAlerts();
    this.api.deleteAccount(id).subscribe({
      next: () => {
        this.message.set('Account deleted.');
        this.loadDashboard();
      },
      error: (error: unknown) => this.showRequestError(error)
    });
  }

  resetAccountForm(): void {
    this.accountForm = this.createEmptyAccountForm();
  }

  submitCategory(): void {
    this.clearAlerts();
    const input: CategoryInputDto = {
      name: this.categoryForm.name,
      kind: this.categoryForm.kind,
      color: this.categoryForm.color
    };

    const request = this.categoryForm.id
      ? this.api.updateCategory(this.categoryForm.id, input)
      : this.api.createCategory(input);

    request.subscribe({
      next: () => {
        this.message.set(this.categoryForm.id ? 'Category updated.' : 'Category created.');
        this.resetCategoryForm();
        this.loadDashboard();
      },
      error: (error: unknown) => this.showRequestError(error)
    });
  }

  editCategory(category: CategoryDto): void {
    this.categoryForm = {
      id: category.id,
      name: category.name,
      kind: category.kind,
      color: category.color
    };
    this.setPanel('category');
  }

  deleteCategory(id: string): void {
    this.clearAlerts();
    this.api.deleteCategory(id).subscribe({
      next: () => {
        this.message.set('Category deleted.');
        this.loadDashboard();
      },
      error: (error: unknown) => this.showRequestError(error)
    });
  }

  resetCategoryForm(): void {
    this.categoryForm = this.createEmptyCategoryForm();
  }

  submitTransaction(): void {
    this.clearAlerts();
    const input: TransactionInputDto = {
      type: this.transactionForm.type,
      amount: Number(this.transactionForm.amount),
      transactionDate: this.transactionForm.transactionDate,
      description: this.transactionForm.description || undefined,
      categoryId: this.transactionForm.type === 'transfer' ? undefined : this.transactionForm.categoryId,
      fromAccountId: this.transactionForm.type === 'income' ? undefined : this.transactionForm.fromAccountId,
      toAccountId: this.transactionForm.type === 'expense' ? undefined : this.transactionForm.toAccountId
    };

    this.api.createTransaction(input).subscribe({
      next: () => {
        this.message.set('Transaction registered.');
        this.transactionForm = this.createEmptyTransactionForm();
        this.activePanel.set('dashboard');
        this.loadDashboard();
      },
      error: (error: unknown) => this.showRequestError(error)
    });
  }

  filteredCategories(type: TransactionType): CategoryDto[] {
    if (type === 'transfer') {
      return [];
    }

    return this.categories().filter((category) => category.kind === type);
  }

  describeTransaction(transaction: TransactionDto): string {
    if (transaction.type === 'transfer') {
      return `${this.accountName(transaction.fromAccountId)} → ${this.accountName(transaction.toAccountId)}`;
    }

    return this.categoryName(transaction.categoryId);
  }

  formatMoney(value: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(value);
  }

  private async initializeAuth(): Promise<void> {
    try {
      const handledCallback = await this.auth.handleRedirectCallback();
      if (handledCallback || this.auth.isAuthenticated()) {
        this.message.set('Signed in successfully.');
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Sign-in callback failed.');
    }
  }

  private loadDashboard(): void {
    forkJoin({
      accounts: this.api.listAccounts(),
      categories: this.api.listCategories(),
      transactions: this.api.listTransactions()
    }).subscribe({
      next: ({ accounts, categories, transactions }) => {
        this.accounts.set(accounts);
        this.categories.set(categories);
        this.transactions.set(transactions);
      },
      error: (error: unknown) => this.showRequestError(error)
    });
  }

  private accountName(id: string | undefined): string {
    return this.accounts().find((account) => account.id === id)?.name ?? 'Account';
  }

  private categoryName(id: string | undefined): string {
    return this.categories().find((category) => category.id === id)?.name ?? 'Category';
  }

  private createEmptyAccountForm(): AccountForm {
    return {
      name: '',
      type: 'checking',
      currency: 'USD',
      balance: 0
    };
  }

  private createEmptyCategoryForm(): CategoryForm {
    return {
      name: '',
      kind: 'expense',
      color: '#0f766e'
    };
  }

  private createEmptyTransactionForm(): TransactionForm {
    return {
      type: 'expense',
      amount: 0,
      categoryId: '',
      fromAccountId: '',
      toAccountId: '',
      transactionDate: new Date().toISOString().slice(0, 10),
      description: ''
    };
  }

  private showRequestError(error: unknown): void {
    const requestError = error as { error?: { message?: string }; message?: string };
    this.error.set(requestError.error?.message ?? requestError.message ?? 'Request failed.');
  }

  private clearAlerts(): void {
    this.message.set('');
    this.error.set('');
  }
}
