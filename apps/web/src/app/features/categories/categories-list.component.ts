import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { Category } from '../../shared/models/domain.models';
import { CategoryService } from './category.service';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="space-y-6 px-5 py-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-emerald-700">{{ familyName() }}</p>
          <h1 class="mt-1 text-2xl font-semibold text-neutral-950">Categorias</h1>
        </div>
        @if (canManage()) {
          <a
            routerLink="/app/categories/new"
            class="rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Crear
          </a>
        }
      </div>

      @if (loading()) {
        <p class="text-sm text-neutral-500">Cargando categorias...</p>
      } @else if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
      } @else {
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          @for (category of categories(); track category.id) {
            <article class="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                [style.background-color]="category.color || '#404040'"
              >
                {{ category.icon || category.name.charAt(0).toUpperCase() }}
              </span>
              <h2 class="min-w-0 truncate font-medium text-neutral-950">{{ category.name }}</h2>
            </article>
          } @empty {
            <div class="rounded-lg border border-dashed border-neutral-300 px-5 py-10 text-center sm:col-span-2">
              <p class="font-medium text-neutral-800">Aun no hay categorias</p>
              <p class="mt-2 text-sm text-neutral-500">Crea categorias para clasificar gastos e ingresos.</p>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class CategoriesListComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly selectedFamily = inject(SelectedFamilyService);

  readonly categories = signal<Category[]>([]);
  readonly familyName = signal('');
  readonly canManage = signal(false);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const [context, categories] = await Promise.all([
        this.selectedFamily.load(),
        this.categoryService.listActive(),
      ]);
      this.familyName.set(context.family.name);
      this.canManage.set(['owner', 'admin'].includes(context.membership.role));
      this.categories.set(categories);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar las categorias.');
    } finally {
      this.loading.set(false);
    }
  }
}
