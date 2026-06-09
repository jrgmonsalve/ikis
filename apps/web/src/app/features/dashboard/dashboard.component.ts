import { Component, computed, effect, inject, signal, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { PeriodService } from '../../core/period/period.service';
import { Account, Category, Currency, RecurringPayment, Transaction } from '../../shared/models/domain.models';
import { calculateAvailableBalance } from '../../shared/utils/finance-calculations';
import { formatCurrency } from '../../shared/utils/formatters';
import { FinancialSummary } from '../../shared/utils/report-calculations';
import { AccountService } from '../accounts/account.service';
import { BudgetService, BudgetWithProgress } from '../budgets/budget.service';
import { CategoryService } from '../categories/category.service';
import { RecurringPaymentService } from '../recurring-payments/recurring-payment.service';
import { ReportService } from '../reports/report.service';
import { TransactionService } from '../transactions/transaction.service';

const emptySummary: FinancialSummary = {
  totalIncome: 0,
  totalExpenses: 0,
  netFlow: 0,
  expensesByCategory: [],
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="space-y-6 px-5 py-6">
      <div class="flex justify-between items-start gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-950">{{ t('Dashboard') }}</h1>
        </div>
        <span class="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600">
          {{ currentPeriodLabel() }}
        </span>
      </div>

      @if (loading()) {
        <p class="text-sm text-neutral-500">{{ t('Calculando resumen...') }}</p>
      } @else if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
      } @else {
        <!-- Budget Health Summary Card -->
        <article class="rounded-lg border border-neutral-200 bg-white p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-semibold text-neutral-500 uppercase tracking-wider">{{ t('Resumen presupuestal') }}</h2>
              <p class="mt-1 text-xs text-neutral-500">{{ t('Comparacion del presupuesto con tu saldo disponible') }}</p>
            </div>
            <span
              class="rounded-lg px-2.5 py-1 text-xs font-semibold"
              [class.bg-emerald-50]="budgetSummary().difference >= 0"
              [class.text-emerald-700]="budgetSummary().difference >= 0"
              [class.bg-red-50]="budgetSummary().difference < 0"
              [class.text-red-700]="budgetSummary().difference < 0"
            >
              {{ budgetSummary().difference >= 0 ? t('Cubierto') : t('Faltante') }}
            </span>
          </div>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <div class="rounded-lg bg-neutral-50 px-3 py-3">
              <p class="text-xs font-medium text-neutral-500">{{ t('Total presupuesto') }}</p>
              <p class="mt-1 text-base font-bold text-neutral-950">{{ money(budgetSummary().totalBudgeted) }}</p>
            </div>
            <div class="rounded-lg bg-neutral-50 px-3 py-3">
              <p class="text-xs font-medium text-neutral-500">{{ t('Total ejecutado') }}</p>
              <p class="mt-1 text-base font-bold text-neutral-950">{{ money(budgetSummary().totalExecuted) }}</p>
            </div>
            <div class="rounded-lg bg-neutral-50 px-3 py-3">
              <p class="text-xs font-medium text-neutral-500">{{ t('Saldo esperado') }}</p>
              <p class="mt-1 text-base font-bold text-neutral-950">{{ money(budgetSummary().expectedAvailableBalance) }}</p>
            </div>
            <div
              class="rounded-lg px-3 py-3"
              [class.bg-emerald-50]="budgetSummary().difference >= 0"
              [class.bg-red-50]="budgetSummary().difference < 0"
            >
              <p
                class="text-xs font-medium"
                [class.text-emerald-700]="budgetSummary().difference >= 0"
                [class.text-red-700]="budgetSummary().difference < 0"
              >
                {{ t('Diferencia') }}
              </p>
              <p
                class="mt-1 text-base font-bold"
                [class.text-emerald-800]="budgetSummary().difference >= 0"
                [class.text-red-800]="budgetSummary().difference < 0"
              >
                {{ money(budgetSummary().difference) }}
              </p>
            </div>
          </div>
        </article>

        <!-- Available Balance Donut Chart Card -->
        <article class="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 class="text-sm font-semibold text-neutral-500 uppercase tracking-wider">{{ t('Saldo disponible') }}</h2>

          <div class="mt-5 flex flex-col sm:flex-row items-center gap-6 justify-around">
            <!-- Donut Chart Container -->
            <div class="relative flex items-center justify-center w-36 h-36 rounded-full flex-shrink-0"
                 [style.background]="chartData().gradient">
              <!-- Inner circle to make it a Donut -->
              <div class="absolute w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center p-2 text-center">
                <span class="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">{{ t('Total') }}</span>
                <span class="text-sm font-bold text-neutral-900 truncate max-w-full">
                  {{ money(availableBalance()) }}
                </span>
              </div>
            </div>

            <!-- Legend/Accounts list -->
            <div class="flex-1 space-y-2.5 w-full max-w-xs">
              @for (item of chartData().legend; track item.name) {
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="w-3 h-3 rounded-full flex-shrink-0" [style.background-color]="item.color"></span>
                    <span class="font-medium text-neutral-700 truncate">{{ item.name }}</span>
                  </div>
                  <span class="font-semibold text-neutral-950 ml-2">{{ money(item.balance) }}</span>
                </div>
              } @empty {
                <p class="text-xs text-neutral-500 text-center py-2">{{ t('Balance disponible') }}</p>
              }
              <div class="pt-2 border-t border-neutral-100 text-right">
                <a routerLink="/app/accounts" class="text-xs font-semibold text-emerald-700 hover:underline">{{ t('Ver cuentas') }}</a>
              </div>
            </div>
          </div>
        </article>

        <div>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-neutral-950">{{ t('Presupuestos') }}</h2>
            <a routerLink="/app/budgets" class="text-sm font-medium text-emerald-700">{{ t('Ver todos') }}</a>
          </div>
          <div class="mt-3 space-y-3">
            @for (item of budgets().slice(0, 3); track item.budget.id) {
              <div class="rounded-lg border border-neutral-200 bg-white p-4">
                <div class="flex justify-between gap-3 text-sm">
                  <span class="font-medium text-neutral-900">{{ item.budget.name }}</span>
                  <span [class.text-red-700]="item.progress.exceeded">{{ item.progress.percentageUsed }}%</span>
                </div>
                <div class="mt-3 h-2 overflow-hidden rounded bg-neutral-200">
                  <div class="h-full rounded bg-emerald-600" [class.bg-red-600]="item.progress.exceeded" [style.width.%]="progressWidth(item.progress.percentageUsed)"></div>
                </div>
              </div>
            } @empty {
              <p class="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">{{ t('Sin presupuestos activos.') }}</p>
            }
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-neutral-950">{{ t('Proximos pagos') }}</h2>
            <a routerLink="/app/recurring-payments" class="text-sm font-medium text-emerald-700">{{ t('Ver todos') }}</a>
          </div>
          <div class="mt-3 space-y-2">
            @for (payment of upcomingPayments().slice(0, 3); track payment.id) {
              <div class="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">
                <div class="flex items-center gap-2 min-w-0">
                  <span>
                    @switch (getStatus(payment)) {
                      @case ('paid') {
                        <i class="fa-solid fa-circle-check text-emerald-600 text-base" [attr.title]="t('Pagado')"></i>
                      }
                      @case ('overdue') {
                        <i class="fa-solid fa-circle-xmark text-red-600 text-base" [attr.title]="t('Proximo vencimiento')"></i>
                      }
                      @default {
                        <i class="fa-solid fa-circle-exclamation text-amber-500 text-base" [attr.title]="t('Proximos pagos')"></i>
                      }
                    }
                  </span>
                  <span class="font-medium text-neutral-800 truncate">{{ payment.name }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="font-semibold text-neutral-900">{{ money(payment.expectedAmount) }}</span>
                  <span class="text-neutral-500 text-xs">{{ dueDate(payment) }}</span>
                </div>
              </div>
            } @empty {
              <p class="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">{{ t('Sin pagos proximos.') }}</p>
            }
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-neutral-950">{{ t('Gastos por categoria') }}</h2>
            <a routerLink="/app/reports" class="text-sm font-medium text-emerald-700">{{ t('Reporte') }}</a>
          </div>
          <div class="mt-3 space-y-2">
            @for (item of summary().expensesByCategory.slice(0, 4); track item.categoryId) {
              <div class="flex justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">
                <span class="font-medium text-neutral-800">{{ categoryName(item.categoryId) }}</span>
                <span class="font-semibold text-neutral-950">{{ money(item.amount) }}</span>
              </div>
            } @empty {
              <p class="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">{{ t('Sin gastos en el periodo.') }}</p>
            }
          </div>
        </div>
        
        <div>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-neutral-950">{{ t('Movimientos') }}</h2>
            <a routerLink="/app/transactions" class="text-sm font-medium text-emerald-700 hover:underline">{{ t('Ver todos') }}</a>
          </div>
          <div class="mt-3 space-y-2">
            @for (tx of recentTransactions(); track tx.id) {
              <div class="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">
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
                  <p class="mt-1 font-medium text-neutral-950 truncate">
                    {{ tx.description || defaultDescription(tx) }}
                  </p>
                </div>
                <span
                  class="font-bold text-right ml-2 whitespace-nowrap"
                  [class.text-red-600]="tx.type === 'expense'"
                  [class.text-emerald-600]="tx.type === 'income'"
                  [class.text-neutral-700]="tx.type === 'transfer'"
                >
                  {{ tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : '' }}{{ money(tx.amount) }}
                </span>
              </div>
            } @empty {
              <p class="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">{{ t('Movimientos') }}</p>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class DashboardComponent {
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly accountService = inject(AccountService);
  private readonly reportService = inject(ReportService);
  private readonly budgetService = inject(BudgetService);
  private readonly recurringService = inject(RecurringPaymentService);
  private readonly categoryService = inject(CategoryService);
  private readonly i18n = inject(I18nService);
  private readonly periodService = inject(PeriodService);
  private readonly transactionService = inject(TransactionService);

  readonly familyName = signal('');
  readonly availableBalance = signal(0);
  readonly activeAccounts = signal<Account[]>([]);
  readonly summary = signal<FinancialSummary>(emptySummary);
  readonly budgets = signal<BudgetWithProgress[]>([]);
  readonly upcomingPayments = signal<RecurringPayment[]>([]);
  readonly recentTransactions = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private readonly cdr = inject(ChangeDetectorRef);
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

  readonly chartData = computed(() => {
    const list = this.activeAccounts().filter(
      (a) => a.status === 'active' && a.type !== 'credit_card' && a.currentBalance > 0
    );
    const total = list.reduce((sum, a) => sum + a.currentBalance, 0);
    if (total === 0) {
      return {
        gradient: 'conic-gradient(#e5e7eb 0% 100%)',
        legend: [],
        hasData: false,
      };
    }

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1'];
    let accumulatedPercentage = 0;

    const slices = list.map((account, index) => {
      const percentage = (account.currentBalance / total) * 100;
      const color = colors[index % colors.length];
      const start = accumulatedPercentage;
      const end = accumulatedPercentage + percentage;
      accumulatedPercentage = end;
      return {
        account,
        color,
        percentage,
        gradientSegment: `${color} ${start.toFixed(1)}% ${end.toFixed(1)}%`,
      };
    });

    const legend = slices.map((s) => ({
      name: s.account.name,
      balance: s.account.currentBalance,
      percentage: s.percentage,
      color: s.color,
    }));

    const gradient = `conic-gradient(${slices.map((s) => s.gradientSegment).join(', ')})`;

    return {
      gradient,
      legend,
      hasData: true,
    };
  });

  readonly budgetSummary = computed(() => {
    const totalBudgeted = this.budgets().reduce(
      (total, item) => total + item.budget.plannedAmount,
      0,
    );
    const totalExecuted = this.budgets().reduce(
      (total, item) => total + item.progress.spentAmount,
      0,
    );
    const expectedAvailableBalance = totalBudgeted - totalExecuted;
    const actualAvailableBalance = this.availableBalance();
    const difference = actualAvailableBalance - expectedAvailableBalance;

    return {
      totalBudgeted,
      totalExecuted,
      expectedAvailableBalance,
      actualAvailableBalance,
      difference,
    };
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
      const context = await this.selectedFamily.load();
      this.periodService.setFromActivePeriod(context.family.activePeriod);
      const period = this.periodService.activePeriod();
      const [accounts, report, budgets, payments, categories, recent] = await Promise.all([
        this.accountService.listActive(),
        this.reportService.load(period.startDate, period.endDate),
        this.budgetService.listWithProgress(),
        this.recurringService.listActive(),
        this.categoryService.listActive(),
        this.transactionService.listRecent(10),
      ]);
      this.familyName.set(context.family.name);
      this.currency = context.family.mainCurrency;
      this.availableBalance.set(calculateAvailableBalance(accounts));
      this.activeAccounts.set(accounts);
      this.summary.set(report.summary);
      const filteredBudgets = budgets.filter((item) => {
        const bStart = item.budget.startDate.toDate();
        const bEnd = item.budget.endDate.toDate();
        return bStart <= period.endDate && bEnd >= period.startDate;
      });
      this.budgets.set(filteredBudgets);
      this.upcomingPayments.set(payments);
      this.categories.set(categories);
      this.recentTransactions.set(recent);
    } catch (error) {
      this.error.set(this.t(error instanceof Error ? error.message : 'No fue posible cargar el dashboard.'));
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }

  t(source: string): string {
    return this.i18n.translate(source);
  }

  money(value: number): string {
    return formatCurrency(value, this.currency);
  }

  categoryName(categoryId: string): string {
    return (
      this.categories().find((category) => category.id === categoryId)?.name ??
      this.i18n.translate('Categoria')
    );
  }

  dueDate(payment: RecurringPayment): string {
    return payment.nextDueDate.toDate().toLocaleDateString(this.i18n.locale());
  }

  progressWidth(value: number): number {
    return Math.min(Math.max(value, 0), 100);
  }

  getStatus(payment: RecurringPayment): 'overdue' | 'paid' | 'pending' {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextDue = payment.nextDueDate.toDate();
    nextDue.setHours(0, 0, 0, 0);

    if (nextDue.getTime() < today.getTime()) {
      return 'overdue';
    }

    if (this.isPaidInCurrentPeriod(payment)) {
      return 'paid';
    }

    return 'pending';
  }

  isPaidInCurrentPeriod(payment: RecurringPayment): boolean {
    if (!payment.lastPaidAt) return false;
    const lastPaid = payment.lastPaidAt.toDate();
    const today = new Date();

    lastPaid.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    switch (payment.frequency) {
      case 'weekly': {
        const diffTime = Math.abs(today.getTime() - lastPaid.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      case 'biweekly': {
        const diffTime = Math.abs(today.getTime() - lastPaid.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 14;
      }
      case 'monthly': {
        return lastPaid.getMonth() === today.getMonth() &&
          lastPaid.getFullYear() === today.getFullYear();
      }
      case 'yearly': {
        return lastPaid.getFullYear() === today.getFullYear();
      }
      default:
        return false;
    }
  }

  typeLabel(type: string): string {
    if (type === 'expense') return this.i18n.translate('Gasto');
    if (type === 'income') return this.i18n.translate('Ingreso');
    return this.i18n.translate('Transferencia');
  }

  dateLabel(tx: Transaction): string {
    return (tx.createdAt ?? tx.transactionDate).toDate().toLocaleString(this.i18n.locale(), {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  accountName(accountId: string): string {
    return this.activeAccounts().find((a) => a.id === accountId)?.name ?? this.i18n.translate('Cuenta');
  }

  defaultDescription(tx: Transaction): string {
    if (tx.type === 'transfer') {
      return `${this.i18n.translate('Transferencia')}: ${this.accountName(tx.destinationAccountId || '')}`;
    }
    return this.categoryName(tx.categoryId || '');
  }
}
