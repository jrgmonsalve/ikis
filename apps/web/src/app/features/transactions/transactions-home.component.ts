import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-transactions-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="space-y-6 px-5 py-6">
      <div>
        <h1 class="text-2xl font-semibold text-neutral-950">Movimientos</h1>
        <p class="mt-2 text-sm text-neutral-500">Registra una operacion financiera en la familia activa.</p>
      </div>

      <div class="space-y-3">
        @for (action of actions; track action.path) {
          <a
            [routerLink]="action.path"
            class="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white px-4 py-4"
          >
            <span>
              <span class="block font-medium text-neutral-950">{{ action.label }}</span>
              <span class="mt-1 block text-sm text-neutral-500">{{ action.description }}</span>
            </span>
            <span aria-hidden="true" class="text-neutral-400">›</span>
          </a>
        }
      </div>

      <div class="rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm text-neutral-600">
        Las transacciones se guardan mediante Cloud Functions y actualizan los saldos de forma atomica.
      </div>
    </section>
  `,
})
export class TransactionsHomeComponent {
  readonly actions = [
    { path: '/app/transactions/expense', label: 'Registrar gasto', description: 'Reduce saldo o aumenta deuda de tarjeta' },
    { path: '/app/transactions/income', label: 'Registrar ingreso', description: 'Aumenta saldo disponible' },
    { path: '/app/transactions/transfer', label: 'Registrar transferencia', description: 'Mueve dinero entre cuentas' },
  ];
}
