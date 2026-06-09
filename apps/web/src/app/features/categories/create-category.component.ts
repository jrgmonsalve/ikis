import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { CategoryService } from './category.service';
import { Subcategory } from '../../shared/models/domain.models';

interface IconItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-create-category',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="mx-auto max-w-md px-5 py-6">
      <a routerLink="/app/categories" class="text-sm font-medium text-neutral-600">Volver a categorias</a>
      <h1 class="mt-5 text-2xl font-semibold text-neutral-950">
        {{ isEdit() ? 'Editar categoria' : 'Crear categoria' }}
      </h1>

      <form class="mt-7 space-y-5" (ngSubmit)="submit()">
        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Nombre</span>
          <input
            name="name"
            [(ngModel)]="name"
            required
            maxlength="50"
            placeholder="Alimentacion"
            class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600"
          />
        </label>

        <div>
          <span class="text-sm font-medium text-neutral-800">Color</span>
          <div class="mt-2 grid grid-cols-5 gap-3">
            @for (c of predefinedColors; track c) {
              <button
                type="button"
                (click)="color = c"
                class="h-10 w-10 rounded-full border border-neutral-200 transition-transform relative focus:outline-none hover:scale-110 flex items-center justify-center cursor-pointer"
                [style.background-color]="c"
                [attr.aria-label]="'Seleccionar color ' + c"
              >
                @if (color === c) {
                  <span class="text-white font-bold text-sm">✓</span>
                }
              </button>
            }
          </div>
        </div>

        <div>
          <span class="text-sm font-medium text-neutral-800">Icono</span>
          <div class="mt-2 grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-neutral-200 rounded-lg p-2.5 bg-neutral-50">
            @for (item of iconCatalog; track item.id) {
              <button
                type="button"
                (click)="icon = item.id"
                class="flex items-center gap-3 rounded-lg border p-3 text-left transition-all focus:outline-none hover:bg-white cursor-pointer"
                [class.border-emerald-600]="icon === item.id"
                [class.bg-white]="icon === item.id"
                [class.border-neutral-200]="icon !== item.id"
                [class.bg-neutral-50]="icon !== item.id"
              >
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-xs"
                  [style.background-color]="color || '#404040'"
                >
                  <i class="fa-solid" [class]="item.id"></i>
                </span>
                <span class="text-xs font-medium text-neutral-800 truncate">{{ item.label }}</span>
              </button>
            }
          </div>
        </div>

        @if (error()) {
          <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
        }

        <button
          type="submit"
          [disabled]="saving()"
          class="w-full rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ saving() ? 'Guardando...' : (isEdit() ? 'Guardar cambios' : 'Guardar categoria') }}
        </button>
      </form>

      @if (isEdit()) {
        <section class="mt-8 border-t border-neutral-200 pt-6">
          <h2 class="text-lg font-semibold text-neutral-950">Subcategorias</h2>

          <form class="mt-4 flex gap-2" (ngSubmit)="saveSubcategory()">
            <label class="sr-only" for="subcategoryName">Nombre de subcategoria</label>
            <input
              id="subcategoryName"
              name="subcategoryName"
              [(ngModel)]="subcategoryName"
              maxlength="50"
              placeholder="Mercado"
              class="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
            <button
              type="submit"
              [disabled]="savingSubcategory()"
              class="rounded-lg bg-neutral-950 px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ editingSubcategoryId() ? 'Guardar' : 'Agregar' }}
            </button>
          </form>

          @if (editingSubcategoryId()) {
            <button
              type="button"
              (click)="cancelSubcategoryEdit()"
              class="mt-2 text-sm font-medium text-neutral-600"
            >
              Cancelar edicion
            </button>
          }

          @if (subcategoryError()) {
            <p class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {{ subcategoryError() }}
            </p>
          }

          @if (subcategories().length === 0) {
            <p class="mt-4 text-sm text-neutral-500">No hay subcategorias activas.</p>
          } @else {
            <div class="mt-4 divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
              @for (subcategory of subcategories(); track subcategory.id) {
                <div class="flex items-center justify-between gap-3 px-3 py-3">
                  <span class="min-w-0 truncate text-sm font-medium text-neutral-900">{{ subcategory.name }}</span>
                  <div class="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      (click)="startSubcategoryEdit(subcategory)"
                      class="text-sm font-medium text-neutral-700"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      (click)="deactivateSubcategory(subcategory.id)"
                      class="text-sm font-medium text-red-700"
                    >
                      Desactivar
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </section>
      }
    </section>
  `,
})
export class CreateCategoryComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  name = '';
  color = '#059669'; // default emerald-600
  icon = 'fa-utensils'; // default food icon

  readonly isEdit = signal(false);
  readonly categoryId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly subcategories = signal<Subcategory[]>([]);
  readonly savingSubcategory = signal(false);
  readonly subcategoryError = signal<string | null>(null);
  readonly editingSubcategoryId = signal<string | null>(null);

  subcategoryName = '';

  readonly predefinedColors = [
    '#059669', // Emerald
    '#16a34a', // Green
    '#0d9488', // Teal
    '#0891b2', // Cyan
    '#0284c7', // Sky
    '#2563eb', // Blue
    '#4f46e5', // Indigo
    '#7c3aed', // Violet
    '#9333ea', // Purple
    '#c026d3', // Fuchsia
    '#db2777', // Pink
    '#e11d48', // Rose
    '#dc2626', // Red
    '#ea580c', // Orange
    '#d97706', // Amber
    '#ca8a04', // Yellow
    '#65a30d', // Lime
    '#475569', // Slate
    '#52525b', // Zinc
    '#78716c', // Stone
  ];

  readonly iconCatalog: IconItem[] = [
    { id: 'fa-utensils', label: 'Comida' },
    { id: 'fa-car', label: 'Transporte' },
    { id: 'fa-house', label: 'Hogar' },
    { id: 'fa-heart-pulse', label: 'Salud' },
    { id: 'fa-film', label: 'Entretenimiento' },
    { id: 'fa-bag-shopping', label: 'Compras' },
    { id: 'fa-graduation-cap', label: 'Educación' },
    { id: 'fa-bolt', label: 'Servicios Públicos' },
    { id: 'fa-tv', label: 'Suscripciones / TV' },
    { id: 'fa-gift', label: 'Regalos' },
    { id: 'fa-spa', label: 'Cuidado Personal' },
    { id: 'fa-plane', label: 'Viajes' },
    { id: 'fa-money-bill-wave', label: 'Ingresos / Sueldo' },
    { id: 'fa-chart-line', label: 'Inversiones' },
    { id: 'fa-receipt', label: 'Impuestos' },
    { id: 'fa-shield-halved', label: 'Seguros' },
    { id: 'fa-dumbbell', label: 'Deportes / Gym' },
    { id: 'fa-paw', label: 'Mascotas' },
    { id: 'fa-briefcase', label: 'Trabajo / Negocios' },
    { id: 'fa-ellipsis', label: 'Otros' },
  ];

  ngOnInit(): void {
    void this.initialize();
  }

  async submit(): Promise<void> {
    if (!this.name.trim()) {
      this.error.set('Ingresa el nombre de la categoria.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      const id = this.categoryId();
      if (this.isEdit() && id) {
        await this.categoryService.update(id, {
          name: this.name,
          color: this.color,
          icon: this.icon,
        });
      } else {
        await this.categoryService.create({
          name: this.name,
          color: this.color,
          icon: this.icon,
        });
      }
      await this.router.navigateByUrl('/app/categories');
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'No fue posible guardar la categoria.'
      );
    } finally {
      this.saving.set(false);
    }
  }

  private async initialize(): Promise<void> {
    console.log('[CreateCategoryComponent] initialize() triggered');
    try {
      const context = await this.selectedFamily.load();
      console.log('[CreateCategoryComponent] Loaded context:', context);
      
      if (!['owner', 'admin'].includes(context.membership.role)) {
        console.warn('[CreateCategoryComponent] User is not owner or admin. Redirecting to categories list.');
        await this.router.navigateByUrl('/app/categories');
        return;
      }

      const id = this.route.snapshot.paramMap.get('id');
      console.log('[CreateCategoryComponent] Extracted category id parameter:', id);
      
      if (id) {
        this.isEdit.set(true);
        this.categoryId.set(id);
        
        console.log('[CreateCategoryComponent] Fetching category by ID from service...');
        const category = await this.categoryService.getById(id);
        console.log('[CreateCategoryComponent] Category fetched successfully:', category);
        
        this.name = category.name;
        this.color = category.color || '#059669';
        this.icon = category.icon || 'fa-utensils';
        await this.loadSubcategories(id);
      } else {
        console.log('[CreateCategoryComponent] No id parameter found, running in creation mode.');
      }
    } catch (error) {
      console.error('[CreateCategoryComponent] Error during initialization:', error);
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar datos.');
    } finally {
      this.cdr.detectChanges();
    }
  }

  async saveSubcategory(): Promise<void> {
    const categoryId = this.categoryId();
    if (!categoryId) {
      return;
    }
    if (!this.subcategoryName.trim()) {
      this.subcategoryError.set('Ingresa el nombre de la subcategoria.');
      return;
    }

    this.savingSubcategory.set(true);
    this.subcategoryError.set(null);
    try {
      const subcategoryId = this.editingSubcategoryId();
      if (subcategoryId) {
        await this.categoryService.updateSubcategory(categoryId, subcategoryId, {
          name: this.subcategoryName,
        });
      } else {
        await this.categoryService.createSubcategory(categoryId, {
          name: this.subcategoryName,
        });
      }
      this.cancelSubcategoryEdit();
      await this.loadSubcategories(categoryId);
    } catch (error) {
      this.subcategoryError.set(
        error instanceof Error ? error.message : 'No fue posible guardar la subcategoria.',
      );
    } finally {
      this.savingSubcategory.set(false);
    }
  }

  startSubcategoryEdit(subcategory: Subcategory): void {
    this.editingSubcategoryId.set(subcategory.id);
    this.subcategoryName = subcategory.name;
    this.subcategoryError.set(null);
  }

  cancelSubcategoryEdit(): void {
    this.editingSubcategoryId.set(null);
    this.subcategoryName = '';
  }

  async deactivateSubcategory(subcategoryId: string): Promise<void> {
    const categoryId = this.categoryId();
    if (!categoryId) {
      return;
    }
    if (!globalThis.confirm(this.i18n.translate('Desactivar esta subcategoria?'))) {
      return;
    }

    this.savingSubcategory.set(true);
    this.subcategoryError.set(null);
    try {
      await this.categoryService.deactivateSubcategory(categoryId, subcategoryId);
      this.cancelSubcategoryEdit();
      await this.loadSubcategories(categoryId);
    } catch (error) {
      this.subcategoryError.set(
        error instanceof Error ? error.message : 'No fue posible desactivar la subcategoria.',
      );
    } finally {
      this.savingSubcategory.set(false);
    }
  }

  private async loadSubcategories(categoryId: string): Promise<void> {
    this.subcategories.set(await this.categoryService.listActiveSubcategories(categoryId));
  }
}
