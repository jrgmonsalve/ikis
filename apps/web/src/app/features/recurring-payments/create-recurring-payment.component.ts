import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { Account, Category, Currency } from '../../shared/models/domain.models';
import { AccountService } from '../accounts/account.service';
import { CategoryService } from '../categories/category.service';
import { RecurringPaymentService } from './recurring-payment.service';

@Component({
  selector: 'app-create-recurring-payment',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="mx-auto max-w-md px-5 py-6">
      <a routerLink="/app/recurring-payments" class="text-sm font-medium text-neutral-600">Volver a pagos</a>
      <h1 class="mt-5 text-2xl font-semibold text-neutral-950">Crear pago recurrente</h1>

      <form class="mt-7 space-y-5" (ngSubmit)="submit()">
        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Nombre</span>
          <input name="name" [(ngModel)]="name" required maxlength="60" class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600" />
        </label>
        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Monto esperado ({{ currency() }})</span>
          <input name="expectedAmount" [(ngModel)]="expectedAmount" type="number" min="0.01" step="0.01" required class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600" />
        </label>
        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Frecuencia</span>
          <select name="frequency" [(ngModel)]="frequency" class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600">
            <option value="weekly">Semanal</option>
            <option value="biweekly">Quincenal</option>
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Proximo vencimiento</span>
          <input name="nextDueDate" [(ngModel)]="nextDueDate" type="date" required class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600" />
        </label>
        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Cuenta sugerida</span>
          <select name="suggestedAccountId" [(ngModel)]="suggestedAccountId" class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600">
            <option value="">Sin sugerencia</option>
            @for (account of accounts(); track account.id) {
              <option [value]="account.id">{{ account.name }}</option>
            }
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Categoria sugerida</span>
          <select name="suggestedCategoryId" [(ngModel)]="suggestedCategoryId" class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600">
            <option value="">Sin sugerencia</option>
            @for (category of categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select>
        </label>

        @if (error()) {
          <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
        }
        <button type="submit" [disabled]="saving()" class="w-full rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {{ saving() ? 'Guardando...' : 'Guardar pago recurrente' }}
        </button>
      </form>
    </section>
  `,
})
export class CreateRecurringPaymentComponent {
  private readonly service = inject(RecurringPaymentService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly router = inject(Router);

  name = '';
  expectedAmount = 0;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly' = 'monthly';
  nextDueDate = new Date().toISOString().slice(0, 10);
  suggestedAccountId = '';
  suggestedCategoryId = '';
  readonly currency = signal<Currency>('COP');
  readonly accounts = signal<Account[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  async submit(): Promise<void> {
    if (!this.name.trim() || this.expectedAmount <= 0) {
      this.error.set('Completa el nombre y un monto mayor que cero.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.service.create({
        name: this.name,
        expectedAmount: this.expectedAmount,
        frequency: this.frequency,
        nextDueDate: new Date(`${this.nextDueDate}T12:00:00`),
        suggestedAccountId: this.suggestedAccountId,
        suggestedCategoryId: this.suggestedCategoryId,
        currency: this.currency(),
      });
      await this.router.navigateByUrl('/app/recurring-payments');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible crear el pago.');
    } finally {
      this.saving.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      const [context, accounts, categories] = await Promise.all([
        this.selectedFamily.load(),
        this.accountService.listActive(),
        this.categoryService.listActive(),
      ]);
      if (!['owner', 'admin'].includes(context.membership.role)) {
        await this.router.navigateByUrl('/app/recurring-payments');
        return;
      }
      this.currency.set(context.family.mainCurrency);
      this.accounts.set(accounts);
      this.categories.set(categories);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar datos.');
    }
  }
}
