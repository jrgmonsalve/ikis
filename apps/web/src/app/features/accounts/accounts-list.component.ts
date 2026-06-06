import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { Account, Currency } from '../../shared/models/domain.models';
import {
  calculateAvailableBalance,
  calculateCreditCardDebt,
} from '../../shared/utils/finance-calculations';
import { formatCurrency } from '../../shared/utils/formatters';
import { AccountService } from './account.service';

const accountTypeLabels: Record<Account['type'], string> = {
  savings: 'Ahorros',
  cash: 'Efectivo',
  digital_wallet: 'Billetera digital',
  credit_card: 'Tarjeta de credito',
};

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="space-y-6 px-5 py-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-emerald-700">{{ familyName() }}</p>
          <h1 class="mt-1 text-2xl font-semibold text-neutral-950">Cuentas</h1>
        </div>
        @if (canManage()) {
          <a
            routerLink="/app/accounts/new"
            class="rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Crear
          </a>
        }
      </div>

      @if (loading()) {
        <p class="text-sm text-neutral-500">Cargando cuentas...</p>
      } @else if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
      } @else {
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-lg border border-neutral-200 bg-white p-4">
            <p class="text-xs font-medium uppercase text-neutral-500">Disponible</p>
            <p class="mt-2 text-xl font-semibold text-neutral-950">
              {{ money(availableBalance()) }}
            </p>
          </div>
          <div class="rounded-lg border border-neutral-200 bg-white p-4">
            <p class="text-xs font-medium uppercase text-neutral-500">Deuda tarjetas</p>
            <p class="mt-2 text-xl font-semibold text-red-700">
              {{ money(creditCardDebt()) }}
            </p>
          </div>
        </div>

        <div class="space-y-3">
          @for (account of accounts(); track account.id) {
            <article class="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-4">
              <div class="min-w-0">
                <h2 class="truncate font-medium text-neutral-950">{{ account.name }}</h2>
                <p class="mt-1 text-sm text-neutral-500">{{ typeLabel(account.type) }}</p>
              </div>
              <div class="text-right">
                <p
                  class="font-semibold"
                  [class.text-red-700]="account.type === 'credit_card'"
                  [class.text-neutral-950]="account.type !== 'credit_card'"
                >
                  {{ money(account.currentBalance) }}
                </p>
                <p class="mt-1 text-xs text-neutral-500">
                  {{ account.type === 'credit_card' ? 'Adeudado' : account.currency }}
                </p>
              </div>
            </article>
          } @empty {
            <div class="rounded-lg border border-dashed border-neutral-300 px-5 py-10 text-center">
              <p class="font-medium text-neutral-800">Aun no hay cuentas</p>
              <p class="mt-2 text-sm text-neutral-500">Crea una cuenta para empezar a registrar movimientos.</p>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class AccountsListComponent {
  private readonly accountService = inject(AccountService);
  private readonly selectedFamily = inject(SelectedFamilyService);

  readonly accounts = signal<Account[]>([]);
  readonly familyName = signal('');
  readonly currency = signal<Currency>('COP');
  readonly canManage = signal(false);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly availableBalance = computed(() => calculateAvailableBalance(this.accounts()));
  readonly creditCardDebt = computed(() => calculateCreditCardDebt(this.accounts()));

  constructor() {
    void this.load();
  }

  money(value: number): string {
    return formatCurrency(value, this.currency());
  }

  typeLabel(type: Account['type']): string {
    return accountTypeLabels[type];
  }

  private async load(): Promise<void> {
    try {
      const [context, accounts] = await Promise.all([
        this.selectedFamily.load(),
        this.accountService.listActive(),
      ]);
      this.familyName.set(context.family.name);
      this.currency.set(context.family.mainCurrency);
      this.canManage.set(['owner', 'admin'].includes(context.membership.role));
      this.accounts.set(accounts);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar las cuentas.');
    } finally {
      this.loading.set(false);
    }
  }
}
