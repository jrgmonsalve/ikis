import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { AccountType, Currency } from '../../shared/models/domain.models';
import { AccountService } from './account.service';

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="mx-auto max-w-md px-5 py-6">
      <a routerLink="/app/accounts" class="text-sm font-medium text-neutral-600">Volver a cuentas</a>
      <h1 class="mt-5 text-2xl font-semibold text-neutral-950">Crear cuenta</h1>
      <p class="mt-2 text-sm text-neutral-500">{{ familyCurrencyLabel() }}</p>

      <form class="mt-7 space-y-5" (ngSubmit)="submit()">
        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Nombre</span>
          <input
            name="name"
            [(ngModel)]="name"
            required
            maxlength="60"
            placeholder="Nequi"
            class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600"
          />
        </label>

        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Tipo de cuenta</span>
          <select
            name="type"
            [(ngModel)]="type"
            class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600"
          >
            <option value="savings">Ahorros</option>
            <option value="cash">Efectivo</option>
            <option value="digital_wallet">Billetera digital</option>
            <option value="credit_card">Tarjeta de credito</option>
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-medium text-neutral-800">
            {{ type === 'credit_card' ? 'Deuda inicial' : 'Saldo inicial' }}
          </span>
          <input
            name="initialBalance"
            [(ngModel)]="initialBalance"
            type="number"
            min="0"
            step="0.01"
            required
            class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600"
          />
        </label>

        @if (error()) {
          <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
        }

        <button
          type="submit"
          [disabled]="saving()"
          class="w-full rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ saving() ? 'Guardando...' : 'Guardar cuenta' }}
        </button>
      </form>
    </section>
  `,
})
export class CreateAccountComponent {
  private readonly accountService = inject(AccountService);
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  name = '';
  type: AccountType = 'savings';
  initialBalance = 0;
  readonly currency = signal<Currency>('COP');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.loadContext();
  }

  familyCurrencyLabel(): string {
    return `${this.i18n.translate('Moneda de la familia')}: ${this.currency()}`;
  }

  async submit(): Promise<void> {
    if (!this.name.trim()) {
      this.error.set('Ingresa el nombre de la cuenta.');
      return;
    }
    if (!Number.isFinite(this.initialBalance) || this.initialBalance < 0) {
      this.error.set('El saldo inicial debe ser cero o mayor.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      await this.accountService.create({
        name: this.name,
        type: this.type,
        initialBalance: this.initialBalance,
        currency: this.currency(),
      });
      await this.router.navigateByUrl('/app/accounts');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible crear la cuenta.');
    } finally {
      this.saving.set(false);
    }
  }

  private async loadContext(): Promise<void> {
    try {
      const context = await this.selectedFamily.load();
      if (!['owner', 'admin'].includes(context.membership.role)) {
        await this.router.navigateByUrl('/app/accounts');
        return;
      }
      this.currency.set(context.family.mainCurrency);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar la familia.');
    }
  }
}
