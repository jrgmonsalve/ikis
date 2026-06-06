import { Component, inject, input, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { AccountService } from '../accounts/account.service';
import { CategoryService } from '../categories/category.service';
import { Account, Category, TransactionType } from '../../shared/models/domain.models';
import { TransactionService } from './transaction.service';
import { NumericFormatterDirective } from '../../shared/directives/numeric-formatter.directive';

const titles: Record<TransactionType, string> = {
  expense: 'Registrar gasto',
  income: 'Registrar ingreso',
  transfer: 'Registrar transferencia',
};

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [FormsModule, RouterLink, NumericFormatterDirective],
  template: `
    <section class="mx-auto max-w-md px-5 py-6">
      <h1 class="text-2xl font-semibold text-neutral-950">{{ title() }}</h1>

      @if (loading()) {
        <p class="mt-6 text-sm text-neutral-500">Cargando cuentas y categorias...</p>
      } @else {
        <form class="mt-7 space-y-4" (ngSubmit)="submit()">
          <div class="floating-group">
            <input
              id="amount"
              name="amount"
              [(ngModel)]="amount"
              appNumericFormatter
              required
              placeholder=" "
              class="floating-input"
            />
            <label for="amount" class="floating-label">Monto</label>
          </div>

          @if (mode() === 'transfer') {
            <div class="floating-group">
              <select
                id="sourceAccountId"
                name="sourceAccountId"
                [(ngModel)]="sourceAccountId"
                required
                class="floating-select appearance-none bg-white pr-10"
              >
                <option value="" disabled selected hidden></option>
                @for (account of accounts(); track account.id) {
                  <option [value]="account.id">{{ account.name }}</option>
                }
              </select>
              <label for="sourceAccountId" class="floating-label">Cuenta origen</label>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400">
                <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>

            <div class="floating-group">
              <select
                id="destinationAccountId"
                name="destinationAccountId"
                [(ngModel)]="destinationAccountId"
                required
                class="floating-select appearance-none bg-white pr-10"
              >
                <option value="" disabled selected hidden></option>
                @for (account of accounts(); track account.id) {
                  <option [value]="account.id">{{ account.name }}</option>
                }
              </select>
              <label for="destinationAccountId" class="floating-label">Cuenta destino</label>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400">
                <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          } @else {
            <div class="floating-group">
              <select
                id="accountId"
                name="accountId"
                [(ngModel)]="accountId"
                required
                class="floating-select appearance-none bg-white pr-10"
              >
                <option value="" disabled selected hidden></option>
                @for (account of accounts(); track account.id) {
                  <option [value]="account.id">{{ account.name }}</option>
                }
              </select>
              <label for="accountId" class="floating-label">Cuenta</label>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400">
                <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>

            <div class="floating-group">
              <select
                id="categoryId"
                name="categoryId"
                [(ngModel)]="categoryId"
                required
                class="floating-select appearance-none bg-white pr-10"
              >
                <option value="" disabled selected hidden></option>
                @for (category of categories(); track category.id) {
                  <option [value]="category.id">{{ category.name }}</option>
                }
              </select>
              <label for="categoryId" class="floating-label">Categoria</label>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400">
                <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          }

          <div class="floating-group">
            <input
              id="transactionDate"
              name="transactionDate"
              [(ngModel)]="transactionDate"
              type="date"
              required
              placeholder=" "
              class="floating-input"
            />
            <label for="transactionDate" class="floating-label">Fecha</label>
          </div>

          <div class="floating-group">
            <input
              id="description"
              name="description"
              [(ngModel)]="description"
              maxlength="160"
              placeholder=" "
              class="floating-input"
            />
            <label for="description" class="floating-label">Descripcion opcional</label>
          </div>

          @if (accounts().length === 0) {
            <p class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Debes <a routerLink="/app/accounts/new" class="font-semibold underline">crear una cuenta</a> primero.
            </p>
          } @else if (mode() !== 'transfer' && categories().length === 0) {
            <p class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Debes <a routerLink="/app/categories/new" class="font-semibold underline">crear una categoria</a> primero.
            </p>
          }

          @if (error()) {
            <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="saving() || !canSubmit()"
            class="w-full rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ saving() ? 'Guardando...' : (isEdit() ? 'Guardar cambios' : 'Guardar movimiento') }}
          </button>
        </form>
      }
    </section>
  `,
})
export class TransactionFormComponent implements OnInit {
  private readonly accountsService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly modeInput = input<TransactionType>(undefined, { alias: 'mode' });
  readonly mode = signal<TransactionType>('expense');
  readonly accounts = signal<Account[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEdit = signal(false);
  readonly transactionId = signal<string | null>(null);

  amount = 0;
  accountId = '';
  categoryId = '';
  sourceAccountId = '';
  destinationAccountId = '';
  description = '';
  transactionDate = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    void this.loadOptions();
  }

  title(): string {
    if (this.isEdit()) {
      return `Editar ${this.mode() === 'expense' ? 'gasto' : this.mode() === 'income' ? 'ingreso' : 'transferencia'}`;
    }
    return titles[this.mode()];
  }

  canSubmit(): boolean {
    if (this.accounts().length === 0) {
      return false;
    }
    if (this.mode() === 'transfer') {
      return this.accounts().length >= 2;
    }
    return this.categories().length > 0;
  }

  async submit(): Promise<void> {
    if (!Number.isFinite(this.amount) || this.amount <= 0) {
      this.error.set('El monto debe ser mayor que cero.');
      return;
    }

    const transactionDate = new Date(`${this.transactionDate}T12:00:00`).toISOString();
    this.saving.set(true);
    this.error.set(null);

    try {
      if (this.isEdit() && this.transactionId()) {
        const originalTx = await this.transactionService.getTransactionById(this.transactionId()!);
        await this.transactionService.cancelTransaction(originalTx);
      }

      if (this.mode() === 'transfer') {
        if (!this.sourceAccountId || !this.destinationAccountId) {
          throw new Error('Selecciona las cuentas de origen y destino.');
        }
        if (this.sourceAccountId === this.destinationAccountId) {
          throw new Error('Las cuentas de origen y destino deben ser diferentes.');
        }
        await this.transactionService.createTransfer({
          amount: this.amount,
          sourceAccountId: this.sourceAccountId,
          destinationAccountId: this.destinationAccountId,
          description: this.description,
          transactionDate,
        });
      } else {
        if (!this.accountId || !this.categoryId) {
          throw new Error('Selecciona una cuenta y una categoria.');
        }
        const inputData = {
          amount: this.amount,
          accountId: this.accountId,
          categoryId: this.categoryId,
          description: this.description,
          transactionDate,
        };
        if (this.mode() === 'expense') {
          await this.transactionService.createExpense(inputData);
        } else {
          await this.transactionService.createIncome(inputData);
        }
      }

      await this.router.navigateByUrl('/app/dashboard');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible guardar el movimiento.');
    } finally {
      this.saving.set(false);
    }
  }

  private async loadOptions(): Promise<void> {
    try {
      if (this.modeInput()) {
        this.mode.set(this.modeInput()!);
      }

      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.isEdit.set(true);
        this.transactionId.set(id);
        const transaction = await this.transactionService.getTransactionById(id);
        this.mode.set(transaction.type);
        this.amount = transaction.amount;
        this.accountId = transaction.accountId || '';
        this.categoryId = transaction.categoryId || '';
        this.sourceAccountId = transaction.sourceAccountId || '';
        this.destinationAccountId = transaction.destinationAccountId || '';
        this.description = transaction.description || '';
        if (transaction.transactionDate) {
          this.transactionDate = transaction.transactionDate.toDate().toISOString().slice(0, 10);
        }
      }

      const [accounts, categories] = await Promise.all([
        this.accountsService.listActive(),
        this.categoryService.listActive(),
      ]);
      this.accounts.set(accounts);
      this.categories.set(categories);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar las opciones.');
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }
}
