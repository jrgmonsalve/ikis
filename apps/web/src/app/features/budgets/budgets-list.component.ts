import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Category } from '../../shared/models/domain.models';
import { formatCurrency } from '../../shared/utils/formatters';
import { CategoryService } from '../categories/category.service';
import { BudgetService, BudgetWithProgress } from './budget.service';

@Component({
  selector: 'app-budgets-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="space-y-6 px-5 py-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-950">Presupuestos</h1>
        </div>
        @if (canManage()) {
          <a routerLink="/app/budgets/new" class="rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white">
            Crear
          </a>
        }
      </div>

      @if (loading()) {
        <p class="text-sm text-neutral-500">Calculando presupuestos...</p>
      } @else if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
      } @else {
        <div class="space-y-3">
          @for (item of budgets(); track item.budget.id) {
            <article class="rounded-lg border border-neutral-200 bg-white p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <h2 class="truncate font-medium text-neutral-950">{{ item.budget.name }}</h2>
                    @if (canManage()) {
                      <a
                        [routerLink]="['/app/budgets', item.budget.id, 'edit']"
                        class="text-xs font-semibold text-emerald-700 hover:underline shrink-0"
                      >
                        Editar
                      </a>
                    }
                  </div>
                  <p class="mt-1 text-sm text-neutral-500">
                    {{ categoryName(item.budget.categoryId) }} · {{ periodLabel(item) }}
                  </p>
                </div>
                <span
                  class="text-sm font-semibold"
                  [class.text-red-700]="item.progress.exceeded"
                  [class.text-neutral-700]="!item.progress.exceeded"
                >
                  {{ item.progress.percentageUsed }}%
                </span>
              </div>

              <div class="mt-4 h-2 overflow-hidden rounded bg-neutral-200">
                <div
                  class="h-full rounded"
                  [class.bg-red-600]="item.progress.exceeded"
                  [class.bg-emerald-600]="!item.progress.exceeded"
                  [style.width.%]="progressWidth(item.progress.percentageUsed)"
                ></div>
              </div>

              <div class="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p class="text-xs text-neutral-500">Planeado</p>
                  <p class="mt-1 font-medium text-neutral-900">{{ money(item.budget.plannedAmount) }}</p>
                </div>
                <div>
                  <p class="text-xs text-neutral-500">Gastado</p>
                  <p class="mt-1 font-medium text-neutral-900">{{ money(item.progress.spentAmount) }}</p>
                </div>
                <div>
                  <p class="text-xs text-neutral-500">Restante</p>
                  <p class="mt-1 font-medium" [class.text-red-700]="item.progress.remainingAmount < 0">
                    {{ money(item.progress.remainingAmount) }}
                  </p>
                </div>
              </div>
            </article>
          } @empty {
            <div class="rounded-lg border border-dashed border-neutral-300 px-5 py-10 text-center">
              <p class="font-medium text-neutral-800">Aun no hay presupuestos</p>
              <p class="mt-2 text-sm text-neutral-500">Define limites por categoria y periodo.</p>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class BudgetsListComponent {
  private readonly budgetService = inject(BudgetService);
  private readonly categoryService = inject(CategoryService);
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly i18n = inject(I18nService);

  readonly budgets = signal<BudgetWithProgress[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly familyName = signal('');
  readonly canManage = signal(false);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private currency: 'COP' | 'USD' = 'COP';

  constructor() {
    void this.load();
  }

  categoryName(categoryId: string): string {
    return (
      this.categories().find((category) => category.id === categoryId)?.name ??
      this.i18n.translate('Categoria')
    );
  }

  money(value: number): string {
    return formatCurrency(value, this.currency);
  }

  periodLabel(item: BudgetWithProgress): string {
    const start = item.budget.startDate.toDate().toLocaleDateString(this.i18n.locale());
    const end = item.budget.endDate.toDate().toLocaleDateString(this.i18n.locale());
    return `${start} - ${end}`;
  }

  progressWidth(percentage: number): number {
    return Math.min(Math.max(percentage, 0), 100);
  }

  private async load(): Promise<void> {
    try {
      const [context, budgets, categories] = await Promise.all([
        this.selectedFamily.load(),
        this.budgetService.listWithProgress(),
        this.categoryService.listActive(),
      ]);
      this.familyName.set(context.family.name);
      this.currency = context.family.mainCurrency;
      this.canManage.set(['owner', 'admin'].includes(context.membership.role));
      this.budgets.set(budgets);
      this.categories.set(categories);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar presupuestos.');
    } finally {
      this.loading.set(false);
    }
  }
}
