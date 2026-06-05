import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FamilyContextService } from '../../core/family-context/family-context.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="space-y-6 px-5 py-6">
      <div>
        <p class="text-sm font-medium text-emerald-700">Familia activa</p>
        <h1 class="mt-1 text-2xl font-semibold text-neutral-950">Dashboard</h1>
        <p class="mt-1 text-sm text-neutral-500">ID: {{ familyContext.selectedFamilyId() || 'sin seleccionar' }}</p>
      </div>

      <div class="grid gap-3">
        <a routerLink="/app/transactions" class="rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white">Registrar movimiento</a>
        <a routerLink="/app/accounts" class="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-900">Cuentas</a>
        <a routerLink="/app/budgets" class="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-900">Presupuestos</a>
      </div>
    </section>
  `,
})
export class DashboardComponent {
  readonly familyContext = inject(FamilyContextService);
}
