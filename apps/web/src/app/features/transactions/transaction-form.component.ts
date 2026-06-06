import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AccountService } from '../accounts/account.service';
import { CategoryService } from '../categories/category.service';
import { Account, Category, TransactionType } from '../../shared/models/domain.models';
import { TransactionService } from './transaction.service';

const titles: Record<TransactionType, string> = {
  expense: 'Registrar gasto',
  income: 'Registrar ingreso',
  transfer: 'Registrar transferencia',
};

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="mx-auto max-w-md px-5 py-6">
      <a routerLink="/app/transactions" class="text-sm font-medium text-neutral-600">Volver a movimientos</a>
      <h1 class="mt-5 text-2xl font-semibold text-neutral-950">{{ title() }}</h1>

      @if (loading()) {
        <p class="mt-6 text-sm text-neutral-500">Cargando cuentas y categorias...</p>
      } @else {
        <form class="mt-7 space-y-5" (ngSubmit)="submit()">
          <label class="block">
            <span class="text-sm font-medium text-neutral-800">Monto</span>
            <input
              name="amount"
              [(ngModel)]="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600"
            />
          </label>

          @if (mode() === 'transfer') {
            <label class="block">
              <span class="text-sm font-medium text-neutral-800">Cuenta origen</span>
              <select
                name="sourceAccountId"
                [(ngModel)]="sourceAccountId"
                required
                class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600"
              >
                <option value="">Selecciona una cuenta</option>
                @for (account of accounts(); track account.id) {
                  <option [value]="account.id">{{ account.name }}</option>
                }
              </select>
            </label>

            <label class="block">
              <span class="text-sm font-medium text-neutral-800">Cuenta destino</span>
              <select
                name="destinationAccountId"
                [(ngModel)]="destinationAccountId"
                required
                class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600"
              >
                <option value="">Selecciona una cuenta</option>
                @for (account of accounts(); track account.id) {
                  <option [value]="account.id">{{ account.name }}</option>
                }
              </select>
            </label>
          } @else {
            <label class="block">
              <span class="text-sm font-medium text-neutral-800">Cuenta</span>
              <select
                name="accountId"
                [(ngModel)]="accountId"
                required
                class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600"
              >
                <option value="">Selecciona una cuenta</option>
                @for (account of accounts(); track account.id) {
                  <option [value]="account.id">{{ account.name }}</option>
                }
              </select>
            </label>

            <label class="block">
              <span class="text-sm font-medium text-neutral-800">Categoria</span>
              <select
                name="categoryId"
                [(ngModel)]="categoryId"
                required
                class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600"
              >
                <option value="">Selecciona una categoria</option>
                @for (category of categories(); track category.id) {
                  <option [value]="category.id">{{ category.name }}</option>
                }
              </select>
            </label>
          }

          <label class="block">
            <span class="text-sm font-medium text-neutral-800">Fecha</span>
            <input
              name="transactionDate"
              [(ngModel)]="transactionDate"
              type="date"
              required
              class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600"
            />
          </label>

          <label class="block">
            <span class="text-sm font-medium text-neutral-800">Descripcion opcional</span>
            <input
              name="description"
              [(ngModel)]="description"
              maxlength="160"
              class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600"
            />
          </label>

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
            {{ saving() ? 'Guardando...' : 'Guardar movimiento' }}
          </button>
        </form>
      }
    </section>
  `,
})
export class TransactionFormComponent {
  private readonly accountsService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);
  private readonly router = inject(Router);

  readonly mode = input.required<TransactionType>();
  readonly accounts = signal<Account[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  amount = 0;
  accountId = '';
  categoryId = '';
  sourceAccountId = '';
  destinationAccountId = '';
  description = '';
  transactionDate = new Date().toISOString().slice(0, 10);

  constructor() {
    void this.loadOptions();
  }

  title(): string {
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
        const input = {
          amount: this.amount,
          accountId: this.accountId,
          categoryId: this.categoryId,
          description: this.description,
          transactionDate,
        };
        if (this.mode() === 'expense') {
          await this.transactionService.createExpense(input);
        } else {
          await this.transactionService.createIncome(input);
        }
      }

      await this.router.navigateByUrl('/app/accounts');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible guardar el movimiento.');
    } finally {
      this.saving.set(false);
    }
  }

  private async loadOptions(): Promise<void> {
    try {
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
    }
  }
}
