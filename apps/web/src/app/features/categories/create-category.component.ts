import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { CategoryService } from './category.service';

@Component({
  selector: 'app-create-category',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="mx-auto max-w-md px-5 py-6">
      <a routerLink="/app/categories" class="text-sm font-medium text-neutral-600">Volver a categorias</a>
      <h1 class="mt-5 text-2xl font-semibold text-neutral-950">Crear categoria</h1>

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

        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Color</span>
          <div class="mt-2 flex items-center gap-3">
            <input name="color" [(ngModel)]="color" type="color" class="h-11 w-14 rounded border border-neutral-300 bg-white p-1" />
            <span class="text-sm text-neutral-500">{{ color }}</span>
          </div>
        </label>

        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Icono</span>
          <select
            name="icon"
            [(ngModel)]="icon"
            class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600"
          >
            <option value="FO">Food</option>
            <option value="TR">Transport</option>
            <option value="HO">Home</option>
            <option value="HE">Health</option>
            <option value="EN">Entertainment</option>
            <option value="IN">Income</option>
            <option value="OT">Other</option>
          </select>
        </label>

        @if (error()) {
          <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
        }

        <button
          type="submit"
          [disabled]="saving()"
          class="w-full rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ saving() ? 'Guardando...' : 'Guardar categoria' }}
        </button>
      </form>
    </section>
  `,
})
export class CreateCategoryComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly router = inject(Router);

  name = '';
  color = '#16a34a';
  icon = 'FO';
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.ensurePermission();
  }

  async submit(): Promise<void> {
    if (!this.name.trim()) {
      this.error.set('Ingresa el nombre de la categoria.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      await this.categoryService.create({
        name: this.name,
        color: this.color,
        icon: this.icon,
      });
      await this.router.navigateByUrl('/app/categories');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible crear la categoria.');
    } finally {
      this.saving.set(false);
    }
  }

  private async ensurePermission(): Promise<void> {
    try {
      const context = await this.selectedFamily.load();
      if (!['owner', 'admin'].includes(context.membership.role)) {
        await this.router.navigateByUrl('/app/categories');
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar la familia.');
    }
  }
}
