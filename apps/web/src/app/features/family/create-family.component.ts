import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Currency } from '../../shared/models/domain.models';
import { FamilyService } from './family.service';

@Component({
  selector: 'app-create-family',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="mx-auto max-w-md px-5 py-8">
      <h1 class="text-2xl font-semibold text-neutral-950">Crear familia</h1>
      <p class="mt-2 text-sm text-neutral-600">Este será tu espacio financiero principal.</p>

      <form class="mt-8 space-y-5" (ngSubmit)="submit()">
        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Nombre</span>
          <input
            name="name"
            [(ngModel)]="name"
            class="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base outline-none focus:border-emerald-600"
            required
            placeholder="Familia Garcia"
          />
        </label>

        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Moneda principal</span>
          <select
            name="currency"
            [(ngModel)]="currency"
            class="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base outline-none focus:border-emerald-600"
          >
            <option value="COP">COP</option>
            <option value="USD">USD</option>
          </select>
        </label>

        @if (error()) {
          <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
        }

        <button class="w-full rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white" type="submit">
          Crear familia
        </button>
      </form>
    </section>
  `,
})
export class CreateFamilyComponent {
  private readonly familyService = inject(FamilyService);
  private readonly router = inject(Router);

  name = '';
  currency: Currency = 'COP';
  readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    if (!this.name.trim()) {
      this.error.set('Ingresa un nombre de familia.');
      return;
    }

    try {
      await this.familyService.createFamily(this.name, this.currency);
      await this.router.navigateByUrl('/app/dashboard');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo crear la familia.');
    }
  }
}
