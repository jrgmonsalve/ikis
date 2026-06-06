import { Component, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Category, Currency, Transaction } from '../../shared/models/domain.models';
import { formatCurrency } from '../../shared/utils/formatters';
import { CategoryService } from '../categories/category.service';
import { AccountService } from '../accounts/account.service';
import { TransactionService } from './transaction.service';

@Component({
  selector: 'app-transactions-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <section class="space-y-6 px-5 py-6">
      <div class="flex justify-between items-start gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-950">Movimientos</h1>
          <p class="mt-2 text-sm text-neutral-500">Registra u organiza operaciones financieras.</p>
        </div>
        <span class="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600">
          {{ displayRangeLabel() }}
        </span>
      </div>

      <!-- Quick Action Buttons -->
      <div class="grid grid-cols-3 gap-2">
        <a
          routerLink="/app/transactions/expense"
          class="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white p-3 text-center transition-colors hover:bg-neutral-50"
        >
          <span class="text-sm font-semibold text-red-600">Gasto</span>
        </a>
        <a
          routerLink="/app/transactions/income"
          class="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white p-3 text-center transition-colors hover:bg-neutral-50"
        >
          <span class="text-sm font-semibold text-emerald-600">Ingreso</span>
        </a>
        <a
          routerLink="/app/transactions/transfer"
          class="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white p-3 text-center transition-colors hover:bg-neutral-50"
        >
          <span class="text-sm font-semibold text-blue-600">Transferir</span>
        </a>
      </div>

      <!-- Custom Date Filter -->
      <div class="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
        <h3 class="text-sm font-semibold text-neutral-800">Filtrar por fecha (Máx. 3 meses)</h3>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-xs font-medium text-neutral-500">Desde</span>
            <input type="date" [(ngModel)]="localStartDate" class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600" />
          </label>
          <label class="block">
            <span class="text-xs font-medium text-neutral-500">Hasta</span>
            <input type="date" [(ngModel)]="localEndDate" class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600" />
          </label>
        </div>
        @if (dateValidationError()) {
          <p class="text-xs text-red-600">{{ dateValidationError() }}</p>
        }
        <button
          type="button"
          (click)="load()"
          [disabled]="!!dateValidationError()"
          class="w-full rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Aplicar Filtro
        </button>
      </div>

      <!-- Transactions History list -->
      <div>
        <h2 class="text-lg font-semibold text-neutral-950 mb-3">Historial de movimientos</h2>

        @if (loading()) {
          <p class="text-sm text-neutral-500">Cargando movimientos...</p>
        } @else if (error()) {
          <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
        } @else {
          <div class="space-y-3">
            @for (tx of paginatedTransactions(); track tx.id) {
              <article class="rounded-lg border border-neutral-200 bg-white p-4">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span
                        class="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                        [class.bg-red-50]="tx.type === 'expense'"
                        [class.text-red-700]="tx.type === 'expense'"
                        [class.bg-emerald-50]="tx.type === 'income'"
                        [class.text-emerald-700]="tx.type === 'income'"
                        [class.bg-blue-50]="tx.type === 'transfer'"
                        [class.text-blue-700]="tx.type === 'transfer'"
                      >
                        {{ typeLabel(tx.type) }}
                      </span>
                      <span class="text-xs text-neutral-500">{{ dateLabel(tx) }}</span>
                    </div>

                    <p class="mt-1.5 font-medium text-neutral-950 truncate">
                      {{ tx.description || defaultDescription(tx) }}
                    </p>

                    <p class="mt-1 text-xs text-neutral-500 truncate">
                      {{ detailLabel(tx) }}
                    </p>
                  </div>

                  <div class="text-right">
                    <p
                      class="text-sm font-bold"
                      [class.text-red-600]="tx.type === 'expense'"
                      [class.text-emerald-600]="tx.type === 'income'"
                      [class.text-neutral-700]="tx.type === 'transfer'"
                    >
                      {{ tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : '' }}{{ money(tx.amount) }}
                    </p>

                    <!-- Edit / Cancel Actions -->
                    <div class="mt-3 flex items-center justify-end gap-3 text-xs">
                      <a
                        [routerLink]="['/app/transactions', tx.id, 'edit']"
                        class="font-semibold text-emerald-700 hover:underline"
                      >
                        Editar
                      </a>
                      <button
                        type="button"
                        (click)="cancel(tx)"
                        class="font-semibold text-red-600 hover:underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            } @empty {
              <div class="rounded-lg border border-dashed border-neutral-300 px-5 py-10 text-center">
                <p class="font-medium text-neutral-800">No hay movimientos en este periodo</p>
                <p class="mt-2 text-sm text-neutral-500">Registra tu primer gasto, ingreso o transferencia.</p>
              </div>
            }
          </div>

          <!-- Pagination Controls -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-between pt-4">
              <button
                type="button"
                [disabled]="currentPage() === 1"
                (click)="prevPage()"
                class="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span class="text-xs text-neutral-500">
                Página {{ currentPage() }} de {{ totalPages() }}
              </span>
              <button
                type="button"
                [disabled]="currentPage() === totalPages()"
                (click)="nextPage()"
                class="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class TransactionsHomeComponent {
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly accountService = inject(AccountService);
  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly allTransactions = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly accounts = signal<any[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private currency: Currency = 'COP';

  localStartDate = '';
  localEndDate = '';
  readonly currentPage = signal<number>(1);

  readonly dateValidationError = computed(() => {
    if (!this.localStartDate || !this.localEndDate) return 'Ambas fechas son obligatorias.';
    const start = new Date(`${this.localStartDate}T00:00:00`).getTime();
    const end = new Date(`${this.localEndDate}T23:59:59`).getTime();
    if (end < start) return 'La fecha de fin no puede ser anterior a la fecha de inicio.';

    const diffTime = end - start;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 90) return 'El rango de fechas no puede superar los 90 días (3 meses).';

    return null;
  });

  readonly paginatedTransactions = computed(() => {
    const start = (this.currentPage() - 1) * 20;
    return this.allTransactions().slice(start, start + 20);
  });

  readonly totalPages = computed(() => {
    return Math.ceil(this.allTransactions().length / 20);
  });

  constructor() {
    const today = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.localStartDate = thirtyDaysAgo.toISOString().slice(0, 10);
    this.localEndDate = today.toISOString().slice(0, 10);

    void this.load();
  }

  async load(): Promise<void> {
    if (this.dateValidationError()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const start = new Date(`${this.localStartDate}T00:00:00`);
      const end = new Date(`${this.localEndDate}T23:59:59`);
      const [context, txs, categories, accounts] = await Promise.all([
        this.selectedFamily.load(),
        this.transactionService.listByDateRange(start, end),
        this.categoryService.listActive(),
        this.accountService.listActive(),
      ]);
      this.currency = context.family.mainCurrency;
      this.allTransactions.set(txs);
      this.categories.set(categories);
      this.accounts.set(accounts);
      this.currentPage.set(1);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar movimientos.');
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }

  displayRangeLabel(): string {
    if (!this.localStartDate || !this.localEndDate) return '';
    const start = new Date(`${this.localStartDate}T12:00:00`).toLocaleDateString(this.i18n.locale());
    const end = new Date(`${this.localEndDate}T12:00:00`).toLocaleDateString(this.i18n.locale());
    return `${start} - ${end}`;
  }

  typeLabel(type: string): string {
    if (type === 'expense') return 'Gasto';
    if (type === 'income') return 'Ingreso';
    return 'Transf.';
  }

  dateLabel(tx: Transaction): string {
    return tx.transactionDate.toDate().toLocaleDateString(this.i18n.locale());
  }

  money(value: number): string {
    return formatCurrency(value, this.currency);
  }

  categoryName(categoryId: string): string {
    return this.categories().find((c) => c.id === categoryId)?.name ?? 'Sin categoria';
  }

  accountName(accountId: string): string {
    return this.accounts().find((a) => a.id === accountId)?.name ?? 'Cuenta';
  }

  defaultDescription(tx: Transaction): string {
    if (tx.type === 'transfer') {
      return `Transferencia a ${this.accountName(tx.destinationAccountId || '')}`;
    }
    return this.categoryName(tx.categoryId || '');
  }

  detailLabel(tx: Transaction): string {
    if (tx.type === 'transfer') {
      return `De: ${this.accountName(tx.sourceAccountId || '')} -> A: ${this.accountName(tx.destinationAccountId || '')}`;
    }
    return `Cuenta: ${this.accountName(tx.accountId || '')}`;
  }

  async cancel(tx: Transaction): Promise<void> {
    const confirmCancel = confirm(
      '¿Estás seguro de que deseas cancelar este movimiento? Esto revertirá los cambios en los saldos de tus cuentas.'
    );
    if (!confirmCancel) return;

    this.loading.set(true);
    try {
      await this.transactionService.cancelTransaction(tx);
      await this.load();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No fue posible cancelar el movimiento.');
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }
}
