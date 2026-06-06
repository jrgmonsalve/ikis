import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { Category, Currency, RecurringPayment } from '../../shared/models/domain.models';
import { calculateAvailableBalance } from '../../shared/utils/finance-calculations';
import { formatCurrency } from '../../shared/utils/formatters';
import { ReportPeriodType, resolveDatePeriod } from '../../shared/utils/period';
import { FinancialSummary } from '../../shared/utils/report-calculations';
import { AccountService } from '../accounts/account.service';
import { BudgetService, BudgetWithProgress } from '../budgets/budget.service';
import { CategoryService } from '../categories/category.service';
import { RecurringPaymentService } from '../recurring-payments/recurring-payment.service';
import { ReportService } from '../reports/report.service';

const emptySummary: FinancialSummary = {
  totalIncome: 0,
  totalExpenses: 0,
  netFlow: 0,
  expensesByCategory: [],
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="space-y-6 px-5 py-6">
      <div>
        <p class="text-sm font-medium text-emerald-700">{{ familyName() }}</p>
        <h1 class="mt-1 text-2xl font-semibold text-neutral-950">Dashboard</h1>
      </div>

      <div class="flex gap-2 overflow-x-auto pb-1">
        <select [(ngModel)]="periodType" class="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm">
          <option value="monthly">Mensual</option>
          <option value="yearly">Anual</option>
          <option value="custom">Personalizado</option>
        </select>
        @if (periodType === 'monthly') {
          <input [(ngModel)]="month" type="number" min="1" max="12" class="w-20 rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          <input [(ngModel)]="year" type="number" class="w-24 rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        } @else if (periodType === 'yearly') {
          <input [(ngModel)]="year" type="number" class="w-24 rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        }
        <button type="button" class="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white" (click)="load()">Aplicar</button>
      </div>
      @if (periodType === 'custom') {
        <div class="grid grid-cols-2 gap-3">
          <input [(ngModel)]="customStart" type="date" class="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          <input [(ngModel)]="customEnd" type="date" class="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        </div>
      }

      @if (loading()) {
        <p class="text-sm text-neutral-500">Calculando resumen...</p>
      } @else if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
      } @else {
        <article class="rounded-lg bg-neutral-950 p-5 text-white">
          <p class="text-sm text-neutral-300">Saldo disponible</p>
          <p class="mt-2 text-3xl font-semibold">{{ money(availableBalance()) }}</p>
          <a routerLink="/app/accounts" class="mt-4 inline-block text-sm font-medium text-emerald-300">Ver cuentas</a>
        </article>

        <div class="grid grid-cols-2 gap-3">
          <article class="rounded-lg border border-neutral-200 bg-white p-4">
            <p class="text-xs uppercase text-neutral-500">Ingresos</p>
            <p class="mt-2 text-lg font-semibold text-emerald-700">{{ money(summary().totalIncome) }}</p>
          </article>
          <article class="rounded-lg border border-neutral-200 bg-white p-4">
            <p class="text-xs uppercase text-neutral-500">Gastos</p>
            <p class="mt-2 text-lg font-semibold text-red-700">{{ money(summary().totalExpenses) }}</p>
          </article>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <a routerLink="/app/transactions/expense" class="rounded-lg bg-red-50 px-3 py-3 text-center text-sm font-semibold text-red-800">Gasto</a>
          <a routerLink="/app/transactions/income" class="rounded-lg bg-emerald-50 px-3 py-3 text-center text-sm font-semibold text-emerald-800">Ingreso</a>
          <a routerLink="/app/transactions/transfer" class="rounded-lg bg-neutral-200 px-3 py-3 text-center text-sm font-semibold text-neutral-800">Transferir</a>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-neutral-950">Presupuestos</h2>
            <a routerLink="/app/budgets" class="text-sm font-medium text-emerald-700">Ver todos</a>
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
              <p class="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">Sin presupuestos activos.</p>
            }
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-neutral-950">Proximos pagos</h2>
            <a routerLink="/app/recurring-payments" class="text-sm font-medium text-emerald-700">Ver todos</a>
          </div>
          <div class="mt-3 space-y-2">
            @for (payment of upcomingPayments().slice(0, 3); track payment.id) {
              <div class="flex justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">
                <span class="font-medium text-neutral-800">{{ payment.name }}</span>
                <span class="text-neutral-600">{{ payment.nextDueDate.toDate().toLocaleDateString('es-CO') }}</span>
              </div>
            } @empty {
              <p class="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">Sin pagos proximos.</p>
            }
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-neutral-950">Gastos por categoria</h2>
            <a routerLink="/app/reports" class="text-sm font-medium text-emerald-700">Reporte</a>
          </div>
          <div class="mt-3 space-y-2">
            @for (item of summary().expensesByCategory.slice(0, 4); track item.categoryId) {
              <div class="flex justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">
                <span class="font-medium text-neutral-800">{{ categoryName(item.categoryId) }}</span>
                <span class="font-semibold text-neutral-950">{{ money(item.amount) }}</span>
              </div>
            } @empty {
              <p class="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">Sin gastos en el periodo.</p>
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

  periodType: ReportPeriodType = 'monthly';
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  customStart = new Date().toISOString().slice(0, 10);
  customEnd = new Date().toISOString().slice(0, 10);
  readonly familyName = signal('');
  readonly availableBalance = signal(0);
  readonly summary = signal<FinancialSummary>(emptySummary);
  readonly budgets = signal<BudgetWithProgress[]>([]);
  readonly upcomingPayments = signal<RecurringPayment[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private currency: Currency = 'COP';

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const period = resolveDatePeriod(this.periodType, this.year, this.month, this.customStart, this.customEnd);
      const [context, accounts, report, budgets, payments, categories] = await Promise.all([
        this.selectedFamily.load(),
        this.accountService.listActive(),
        this.reportService.load(period.startDate, period.endDate),
        this.budgetService.listWithProgress(),
        this.recurringService.listActive(),
        this.categoryService.listActive(),
      ]);
      this.familyName.set(context.family.name);
      this.currency = context.family.mainCurrency;
      this.availableBalance.set(calculateAvailableBalance(accounts));
      this.summary.set(report.summary);
      this.budgets.set(budgets);
      this.upcomingPayments.set(payments.filter((payment) => payment.nextDueDate.toMillis() >= Date.now()));
      this.categories.set(categories);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar el dashboard.');
    } finally {
      this.loading.set(false);
    }
  }

  money(value: number): string {
    return formatCurrency(value, this.currency);
  }

  categoryName(categoryId: string): string {
    return this.categories().find((category) => category.id === categoryId)?.name ?? 'Categoria';
  }

  progressWidth(value: number): number {
    return Math.min(Math.max(value, 0), 100);
  }
}
