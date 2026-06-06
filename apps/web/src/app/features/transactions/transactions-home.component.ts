import { Component, inject, signal, effect, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { PeriodService } from '../../core/period/period.service';
import { Category, Currency, Transaction } from '../../shared/models/domain.models';
import { formatCurrency } from '../../shared/utils/formatters';
import { CategoryService } from '../categories/category.service';
import { AccountService } from '../accounts/account.service';
import { ReportService } from '../reports/report.service';
import { TransactionService } from './transaction.service';

@Component({
  selector: 'app-transactions-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="space-y-6 px-5 py-6">
      <div class="flex justify-between items-start gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-950">Movimientos</h1>
          <p class="mt-2 text-sm text-neutral-500">Registra u organiza operaciones financieras.</p>
        </div>
        <span class="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600">
          {{ currentPeriodLabel() }}
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

      <!-- Transactions History list -->
      <div>
        <h2 class="text-lg font-semibold text-neutral-950 mb-3">Historial de movimientos</h2>

        @if (loading()) {
          <p class="text-sm text-neutral-500">Cargando movimientos...</p>
        } @else if (error()) {
          <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
        } @else {
          <div class="space-y-3">
            @for (tx of transactions(); track tx.id) {
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
        }
      </div>
    </section>
  `,
})
export class TransactionsHomeComponent {
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly reportService = inject(ReportService);
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly accountService = inject(AccountService);
  private readonly periodService = inject(PeriodService);
  private readonly i18n = inject(I18nService);

  readonly transactions = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly accounts = signal<any[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private currency: Currency = 'COP';

  readonly currentPeriodLabel = computed(() => {
    const s = this.periodService.state();
    if (s.periodType === 'monthly') {
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return this.i18n.translate(monthNames[s.month - 1]) + ' ' + s.year;
    }
    if (s.periodType === 'yearly') {
      return s.year.toString();
    }
    const start = new Date(`${s.customStart}T00:00:00`).toLocaleDateString(this.i18n.locale());
    const end = new Date(`${s.customEnd}T00:00:00`).toLocaleDateString(this.i18n.locale());
    return `${start} - ${end}`;
  });

  constructor() {
    effect(() => {
      this.periodService.state();
      void this.load();
    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const period = this.periodService.activePeriod();
      const [context, report, categories, accounts] = await Promise.all([
        this.selectedFamily.load(),
        this.reportService.load(period.startDate, period.endDate),
        this.categoryService.listActive(),
        this.accountService.listActive(),
      ]);
      this.currency = context.family.mainCurrency;
      this.transactions.set(report.transactions);
      this.categories.set(categories);
      this.accounts.set(accounts);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar movimientos.');
    } finally {
      this.loading.set(false);
    }
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
    }
  }
}
