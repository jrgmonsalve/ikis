import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  Budget,
  BudgetPeriodType,
  Category,
  Currency,
} from '../../shared/models/domain.models';
import { CategoryService } from '../categories/category.service';
import { BudgetService } from './budget.service';
import { NumericFormatterDirective } from '../../shared/directives/numeric-formatter.directive';
import {
  PeriodState,
  activePeriodToState,
  formatPeriodState,
  resolvePeriodState,
} from '../../shared/utils/period';

@Component({
  selector: 'app-create-budget',
  standalone: true,
  imports: [FormsModule, RouterLink, NumericFormatterDirective],
  template: `
    <section class="mx-auto max-w-md px-5 py-6">
      <a routerLink="/app/budgets" class="text-sm font-medium text-neutral-600">Volver a presupuestos</a>
      <h1 class="mt-5 text-2xl font-semibold text-neutral-950">
        {{ title() }}
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

        <div class="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
          <p class="text-xs font-medium uppercase text-neutral-500">Periodo</p>
          <p class="mt-1 text-sm font-semibold text-neutral-900">{{ periodSummary() }}</p>
          <p class="mt-1 text-xs text-neutral-500">
            {{ isEdit() ? 'El periodo de un presupuesto existente se conserva.' : 'Se toma del periodo configurado para la familia.' }}
          </p>
        </div>

        @if (categories().length === 0) {
          <p class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Debes <a routerLink="/app/categories/new" class="font-semibold underline">crear una categoria</a> primero.
          </p>
        }

        @if (error()) {
          <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
        }

        <button type="submit" [disabled]="saving() || categories().length === 0" class="w-full rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {{ submitLabel() }}
        </button>
      </form>
    </section>
  `,
})
export class CreateBudgetComponent implements OnInit {
  private readonly budgetService = inject(BudgetService);
  private readonly categoryService = inject(CategoryService);
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);

  name = '';
  categoryId = '';
  plannedAmount = 0;
  periodType: BudgetPeriodType = 'monthly';
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  customStart = new Date().toISOString().slice(0, 10);
  customEnd = new Date().toISOString().slice(0, 10);
  private familyPeriod: PeriodState = activePeriodToState(null);
  private editPeriod: PeriodState | null = null;
  readonly isEdit = signal(false);
  readonly isCopy = signal(false);
  readonly budgetId = signal<string | null>(null);
  readonly currency = signal<Currency>('COP');
  readonly categories = signal<Category[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  title(): string {
    if (this.isCopy()) return this.i18n.translate('Copiar presupuesto');
    return this.i18n.translate(this.isEdit() ? 'Editar presupuesto' : 'Crear presupuesto');
  }

  submitLabel(): string {
    if (this.saving()) return this.i18n.translate('Guardando...');
    return this.i18n.translate(this.isEdit() ? 'Guardar cambios' : 'Guardar presupuesto');
  }

  amountLabel(): string {
    return `${this.i18n.translate('Monto planeado')} (${this.currency()})`;
  }

  periodSummary(): string {
    return formatPeriodState(this.editPeriod ?? this.familyPeriod, this.i18n.locale());
  }

  async submit(): Promise<void> {
    try {
      if (!this.name.trim() || !this.categoryId) {
        throw new Error('Completa el nombre y la categoria.');
      }
      if (!Number.isFinite(this.plannedAmount) || this.plannedAmount <= 0) {
        throw new Error('El monto planeado debe ser mayor que cero.');
      }

      this.saving.set(true);
      this.error.set(null);

      const id = this.budgetId();
      const periodState = this.isEdit() && this.editPeriod ? this.editPeriod : this.familyPeriod;
      const period = resolvePeriodState(periodState);
      const budgetData = {
        name: this.name,
        categoryId: this.categoryId,
        plannedAmount: this.plannedAmount,
        periodType: periodState.periodType,
        startDate: period.startDate,
        endDate: period.endDate,
        currency: this.currency(),
        month: periodState.periodType === 'monthly' ? periodState.month : undefined,
        year: periodState.periodType !== 'custom' ? periodState.year : undefined,
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
      this.familyPeriod = activePeriodToState(context.family.activePeriod);
      this.applyPeriodState(this.familyPeriod);

      const id = this.route.snapshot.paramMap.get('id');
      const copyMode = this.route.snapshot.data?.['mode'] === 'copy';
      if (id) {
        this.isCopy.set(copyMode);
        this.isEdit.set(!copyMode);
        this.budgetId.set(id);
        const budget = await this.budgetService.getById(id);
        if (copyMode && budget.endDate.toMillis() >= Date.now()) {
          await this.router.navigateByUrl('/app/budgets');
          return;
        }
        this.name = budget.name;
        this.categoryId = budget.categoryId;
        this.plannedAmount = budget.plannedAmount;
        if (copyMode) {
          this.editPeriod = null;
          this.applyPeriodState(this.familyPeriod);
        } else {
          this.editPeriod = this.periodStateFromBudget(budget);
          this.applyPeriodState(this.editPeriod);
        }
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar datos.');
    } finally {
      this.cdr.detectChanges();
    }
  }

  private periodStateFromBudget(budget: Budget): PeriodState {
    if (budget.periodType === 'custom') {
      return {
        periodType: 'custom',
        month: this.familyPeriod.month,
        year: this.familyPeriod.year,
        customStart: budget.startDate.toDate().toISOString().slice(0, 10),
        customEnd: budget.endDate.toDate().toISOString().slice(0, 10),
      };
    }

    if (budget.periodType === 'yearly') {
      return {
        ...this.familyPeriod,
        periodType: 'yearly',
        year: budget.year ?? budget.startDate.toDate().getFullYear(),
      };
    }

    const startDate = budget.startDate.toDate();
    return {
      ...this.familyPeriod,
      periodType: 'monthly',
      month: budget.month ?? startDate.getMonth() + 1,
      year: budget.year ?? startDate.getFullYear(),
    };
  }

  private applyPeriodState(state: PeriodState): void {
    this.periodType = state.periodType;
    this.month = state.month;
    this.year = state.year;
    this.customStart = state.customStart;
    this.customEnd = state.customEnd;
  }
}
