import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-more',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="space-y-6 px-5 py-6">
      <div>
        <h1 class="text-2xl font-semibold text-neutral-950">Mas</h1>
        <p class="mt-2 text-sm text-neutral-500">Configuracion y administracion de la familia.</p>
      </div>

      <nav class="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        @for (item of items; track item.path) {
          <a [routerLink]="item.path" class="flex items-center justify-between gap-4 px-4 py-4">
            <span>
              <span class="block font-medium text-neutral-950">{{ item.label }}</span>
              <span class="mt-1 block text-sm text-neutral-500">{{ item.description }}</span>
            </span>
            <span aria-hidden="true" class="text-neutral-400">›</span>
          </a>
        }
      </nav>
    </section>
  `,
})
export class MoreComponent {
  readonly items = [
    { path: '/app/transactions', label: 'Movimientos', description: 'Historial de ingresos, gastos y transferencias' },
    { path: '/app/budgets', label: 'Presupuestos', description: 'Limites por categoria' },
    { path: '/app/reports', label: 'Reportes', description: 'Resumen de ingresos y gastos' },
    { path: '/app/accounts', label: 'Cuentas', description: 'Saldos y tipos de cuenta' },
    { path: '/app/categories', label: 'Categorias', description: 'Clasificacion de movimientos' },
    { path: '/app/recurring-payments', label: 'Pagos recurrentes', description: 'Obligaciones proximas' },
    { path: '/app/family-members', label: 'Miembros', description: 'Personas y roles de la familia' },
    { path: '/app/settings', label: 'Configuracion', description: 'Idioma, moneda y perfil' },
  ];
}
