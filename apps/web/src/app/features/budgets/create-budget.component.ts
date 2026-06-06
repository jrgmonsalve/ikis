import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  BudgetPeriodType,
  Category,
  Currency,
} from '../../shared/models/domain.models';
import { CategoryService } from '../categories/category.service';
import { BudgetService } from './budget.service';
import { NumericFormatterDirective } from '../../shared/directives/numeric-formatter.directive';

@Component({
  selector: 'app-create-budget',
  standalone: true,
  imports: [FormsModule, RouterLink, NumericFormatterDirective],
  template: `
    <section class="mx-auto max-w-md px-5 py-6">
      <a routerLink="/app/budgets" class="text-sm font-medium text-neutral-600">Volver a presupuestos</a>
      <h1 class="mt-5 text-2xl font-semibold text-neutral-950">
        {{ isEdit() ? 'Editar presupuesto' : 'Crear presupuesto' }}
      </h1>

      <form class="mt-7 space-y-5" (ngSubmit)="submit()">
        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Nombre</span>
          <input name="name" [(ngModel)]="name" required maxlength="60" class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600" />
        </label>

        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Categoria</span>
          <select name="categoryId" [(ngModel)]="categoryId" required class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600">
            <option value="">Selecciona una categoria</option>
            @for (category of categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-medium text-neutral-800">{{ amountLabel() }}</span>
          <input name="plannedAmount" [(ngModel)]="plannedAmount" appNumericFormatter required class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600" />
        </label>

        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Periodo</span>
          <select name="periodType" [(ngModel)]="periodType" class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600">
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
            <option value="custom">Personalizado</option>
          </select>
        </label>

        @if (periodType === 'monthly') {
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="text-sm font-medium text-neutral-800">Mes</span>
              <input name="month" [(ngModel)]="month" type="number" min="1" max="12" inputmode="numeric" required class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600" />
            </label>
            <label class="block">
              <span class="text-sm font-medium text-neutral-800">Ano</span>
              <input name="year" [(ngModel)]="year" type="number" min="2020" max="2100" inputmode="numeric" required class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600" />
            </label>
          </div>
        } @else if (periodType === 'yearly') {
          <label class="block">
            <span class="text-sm font-medium text-neutral-800">Ano</span>
            <input name="year" [(ngModel)]="year" type="number" min="2020" max="2100" inputmode="numeric" required class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600" />
          </label>
        } @else {
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="text-sm font-medium text-neutral-800">Inicio</span>
              <input name="customStart" [(ngModel)]="customStart" type="date" required class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600" />
            </label>
            <label class="block">
              <span class="text-sm font-medium text-neutral-800">Fin</span>
              <input name="customEnd" [(ngModel)]="customEnd" type="date" required class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600" />
            </label>
          </div>
        }

        @if (categories().length === 0) {
          <p class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Debes <a routerLink="/app/categories/new" class="font-semibold underline">crear una categoria</a> primero.
          </p>
        }

        @if (error()) {
          <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
        }

        <button type="submit" [disabled]="saving() || categories().length === 0" class="w-full rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {{ saving() ? 'Guardando...' : (isEdit() ? 'Guardar cambios' : 'Guardar presupuesto') }}
        </button>
      </form>
    </section>
  `,
})
export class CreateBudgetComponent {
  private readonly budgetService = inject(BudgetService);
  private readonly categoryService = inject(CategoryService);
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  name = '';
  categoryId = '';
  plannedAmount = 0;
  periodType: BudgetPeriodType = 'monthly';
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  customStart = new Date().toISOString().slice(0, 10);
  customEnd = new Date().toISOString().slice(0, 10);
  readonly isEdit = signal(false);
  readonly budgetId = signal<string | null>(null);
  readonly currency = signal<Currency>('COP');
  readonly categories = signal<Category[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  amountLabel(): string {
    return `${this.i18n.translate('Monto planeado')} (${this.currency()})`;
  }

  async submit(): Promise<void> {
    try {
      const period = this.resolvePeriod();
      if (!this.name.trim() || !this.categoryId) {
        throw new Error('Completa el nombre y la categoria.');
      }
      if (!Number.isFinite(this.plannedAmount) || this.plannedAmount <= 0) {
        throw new Error('El monto planeado debe ser mayor que cero.');
      }

      this.saving.set(true);
      this.error.set(null);

      const id = this.budgetId();
      const budgetData = {
        name: this.name,
        categoryId: this.categoryId,
        plannedAmount: this.plannedAmount,
        periodType: this.periodType,
        startDate: period.startDate,
        endDate: period.endDate,
        currency: this.currency(),
        month: this.periodType === 'monthly' ? this.month : undefined,
        year: this.periodType !== 'custom' ? this.year : undefined,
      };

      if (this.isEdit() && id) {
        await this.budgetService.update(id, budgetData);
      } else {
        await this.budgetService.create(budgetData);
      }
      await this.router.navigateByUrl('/app/budgets');
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'No fue posible guardar el presupuesto.'
      );
    } finally {
      this.saving.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      const [context, categories] = await Promise.all([
        this.selectedFamily.load(),
        this.categoryService.listActive(),
      ]);
      if (!['owner', 'admin'].includes(context.membership.role)) {
        await this.router.navigateByUrl('/app/budgets');
        return;
      }
      this.currency.set(context.family.mainCurrency);
      this.categories.set(categories);

      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.isEdit.set(true);
        this.budgetId.set(id);
        const budget = await this.budgetService.getById(id);
        this.name = budget.name;
        this.categoryId = budget.categoryId;
        this.plannedAmount = budget.plannedAmount;
        this.periodType = budget.periodType;
        if (budget.month) this.month = budget.month;
        if (budget.year) this.year = budget.year;
        if (budget.periodType === 'custom') {
          this.customStart = budget.startDate.toDate().toISOString().slice(0, 10);
          this.customEnd = budget.endDate.toDate().toISOString().slice(0, 10);
        }
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar datos.');
    }
  }

  private resolvePeriod(): { startDate: Date; endDate: Date } {
    if (this.periodType === 'monthly') {
      if (this.month < 1 || this.month > 12) {
        throw new Error('Selecciona un mes valido.');
      }
      return {
        startDate: new Date(this.year, this.month - 1, 1, 0, 0, 0, 0),
        endDate: new Date(this.year, this.month, 0, 23, 59, 59, 999),
      };
    }

    if (this.periodType === 'yearly') {
      return {
        startDate: new Date(this.year, 0, 1, 0, 0, 0, 0),
        endDate: new Date(this.year, 11, 31, 23, 59, 59, 999),
      };
    }

    const startDate = new Date(`${this.customStart}T00:00:00`);
    const endDate = new Date(`${this.customEnd}T23:59:59.999`);
    if (startDate.getTime() > endDate.getTime()) {
      throw new Error('La fecha inicial debe ser anterior a la fecha final.');
    }
    return { startDate, endDate };
  }
}
