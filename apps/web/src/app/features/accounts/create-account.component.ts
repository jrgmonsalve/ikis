import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { AccountType, Currency } from '../../shared/models/domain.models';
import { AccountService } from './account.service';
import { NumericFormatterDirective } from '../../shared/directives/numeric-formatter.directive';

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [FormsModule, RouterLink, NumericFormatterDirective],
  template: `
    <section class="mx-auto max-w-md px-5 py-6">
      <div class="flex items-center gap-4">
        <a
          routerLink="/app/accounts"
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
          aria-label="Volver a cuentas"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </a>
        <h1 class="text-2xl font-semibold text-neutral-950">Crear cuenta</h1>
      </div>
      <p class="mt-2 text-sm text-neutral-500 pl-13">{{ familyCurrencyLabel() }}</p>

      <form class="mt-7 space-y-4" (ngSubmit)="submit()">
        <div class="floating-group">
          <input
            id="name"
            name="name"
            [(ngModel)]="name"
            required
            maxlength="60"
            placeholder=" "
            class="floating-input"
          />
          <label for="name" class="floating-label">Nombre</label>
        </div>

        <div class="floating-group">
          <select
            id="type"
            name="type"
            [(ngModel)]="type"
            class="floating-select appearance-none bg-white pr-10"
          >
            <option value="savings">Ahorros</option>
            <option value="cash">Efectivo</option>
            <option value="digital_wallet">Billetera digital</option>
            <option value="credit_card">Tarjeta de credito</option>
          </select>
          <label for="type" class="floating-label">Tipo de cuenta</label>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400">
            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>

        <div class="floating-group">
          <input
            id="initialBalance"
            name="initialBalance"
            [(ngModel)]="initialBalance"
            appNumericFormatter
            required
            placeholder=" "
            class="floating-input"
          />
          <label for="initialBalance" class="floating-label">
            {{ type === 'credit_card' ? 'Deuda inicial' : 'Saldo inicial' }}
          </label>
        </div>

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
