import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { FamilyContextService } from '../../core/family-context/family-context.service';
import { FamilyService, UserFamily } from './family.service';

@Component({
  selector: 'app-select-family',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-md px-5 py-8">
      <h1 class="text-2xl font-semibold text-neutral-950">Selecciona una familia</h1>
      <div class="mt-6 space-y-3">
        @if (loading()) {
          <p class="rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-600">
            Cargando familias...
          </p>
        } @else if (families().length === 0) {
          <p class="rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-600">No tienes familias activas todavía.</p>
        } @else {
          @for (item of families(); track item.family.id) {
            <button
              type="button"
              class="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left shadow-sm"
              (click)="select(item)"
            >
              <span class="block font-medium text-neutral-950">{{ item.family.name }}</span>
              <span class="text-sm text-neutral-500">{{ item.membership.role }} · {{ item.family.mainCurrency }}</span>
            </button>
          }
        }
      </div>

      @if (!loading() && families().length === 0) {
        <a routerLink="/create-family" class="mt-6 block rounded-lg bg-neutral-950 px-4 py-3 text-center text-sm font-semibold text-white">
          Crear familia
        </a>
      }
    </section>
  `,
})
export class SelectFamilyComponent {
  private readonly familyService = inject(FamilyService);
  private readonly familyContext = inject(FamilyContextService);
  private readonly router = inject(Router);

  readonly families = signal<UserFamily[]>([]);
  readonly loading = signal(true);

  constructor() {
    void this.load();
  }

  async select(item: UserFamily): Promise<void> {
    this.familyContext.selectFamily(item.family.id);
    await this.router.navigateByUrl('/app/dashboard');
  }

  private async load(): Promise<void> {
    try {
      const families = await this.familyService.listCurrentUserFamilies();
      this.families.set(families);

      if (families.length === 1) {
        await this.select(families[0]);
      }
    } finally {
      this.loading.set(false);
    }
  }
}
