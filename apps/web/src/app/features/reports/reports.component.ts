import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Category, Currency } from '../../shared/models/domain.models';
import { formatCurrency } from '../../shared/utils/formatters';
import {
  ReportPeriodType,
  resolveDatePeriod,
} from '../../shared/utils/period';
import { FinancialSummary } from '../../shared/utils/report-calculations';
import { CategoryService } from '../categories/category.service';
import { ReportService } from './report.service';

const emptySummary: FinancialSummary = {
  totalIncome: 0,
  totalExpenses: 0,
  netFlow: 0,
  expensesByCategory: [],
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="space-y-6 px-5 py-6">
      <div>
        <h1 class="text-2xl font-semibold text-neutral-950">Reportes</h1>
      </div>

      <div class="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
        <select [(ngModel)]="periodType" class="w-full rounded-lg border border-neutral-300 px-3 py-2.5">
          <option value="monthly">Mensual</option>
          <option value="yearly">Anual</option>
          <option value="custom">Personalizado</option>
        </select>
        @if (periodType === 'monthly') {
          <div class="grid grid-cols-2 gap-3">
            <input [(ngModel)]="month" type="number" min="1" max="12" inputmode="numeric" class="rounded-lg border border-neutral-300 px-3 py-2.5" />
            <input [(ngModel)]="year" type="number" min="2020" max="2100" inputmode="numeric" class="rounded-lg border border-neutral-300 px-3 py-2.5" />
          </div>
        } @else if (periodType === 'yearly') {
          <input [(ngModel)]="year" type="number" min="2020" max="2100" inputmode="numeric" class="w-full rounded-lg border border-neutral-300 px-3 py-2.5" />
        } @else {
          <div class="grid grid-cols-2 gap-3">
            <input [(ngModel)]="customStart" type="date" class="rounded-lg border border-neutral-300 px-3 py-2.5" />
            <input [(ngModel)]="customEnd" type="date" class="rounded-lg border border-neutral-300 px-3 py-2.5" />
          </div>
        }
        <button type="button" class="w-full rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white" (click)="load()">
          Aplicar periodo
        </button>
      </div>

      @if (loading()) {
        <p class="text-sm text-neutral-500">Calculando reporte...</p>
      } @else if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
      } @else {
        <div class="grid grid-cols-3 gap-3">
          <article class="rounded-lg border border-neutral-200 bg-white p-3">
            <p class="text-xs text-neutral-500">Ingresos</p>
            <p class="mt-2 text-sm font-semibold text-emerald-700">{{ money(summary().totalIncome) }}</p>
          </article>
          <article class="rounded-lg border border-neutral-200 bg-white p-3">
            <p class="text-xs text-neutral-500">Gastos</p>
            <p class="mt-2 text-sm font-semibold text-red-700">{{ money(summary().totalExpenses) }}</p>
          </article>
          <article class="rounded-lg border border-neutral-200 bg-white p-3">
            <p class="text-xs text-neutral-500">Flujo neto</p>
            <p class="mt-2 text-sm font-semibold text-neutral-950">{{ money(summary().netFlow) }}</p>
          </article>
        </div>

        <div>
          <h2 class="text-lg font-semibold text-neutral-950">Gastos por categoria</h2>
          <div class="mt-3 space-y-3">
            @for (item of summary().expensesByCategory; track item.categoryId) {
              <div class="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3">
                <span class="text-sm font-medium text-neutral-800">{{ categoryName(item.categoryId) }}</span>
                <span class="text-sm font-semibold text-neutral-950">{{ money(item.amount) }}</span>
              </div>
            } @empty {
              <p class="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500">
                No hay gastos en este periodo.
              </p>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class ReportsComponent {
  private readonly reportService = inject(ReportService);
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly categoryService = inject(CategoryService);
  private readonly i18n = inject(I18nService);

  periodType: ReportPeriodType = 'monthly';
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  customStart = new Date().toISOString().slice(0, 10);
  customEnd = new Date().toISOString().slice(0, 10);
  readonly familyName = signal('');
  readonly summary = signal<FinancialSummary>(emptySummary);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private currency: Currency = 'COP';

  constructor() {
    void this.initialize();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const period = resolveDatePeriod(
        this.periodType,
        this.year,
        this.month,
        this.customStart,
        this.customEnd,
      );
      if (period.startDate.getTime() > period.endDate.getTime()) {
        throw new Error('El rango de fechas no es valido.');
      }
      const report = await this.reportService.load(period.startDate, period.endDate);
      this.summary.set(report.summary);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar el reporte.');
    } finally {
      this.loading.set(false);
    }
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

  private async initialize(): Promise<void> {
    try {
      const [context, categories] = await Promise.all([
        this.selectedFamily.load(),
        this.categoryService.listActive(),
      ]);
      this.familyName.set(context.family.name);
      this.currency = context.family.mainCurrency;
      this.categories.set(categories);
      await this.load();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible iniciar reportes.');
      this.loading.set(false);
    }
  }
}
