import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Account, Category, RecurringPayment } from '../../shared/models/domain.models';
import { AccountService } from '../accounts/account.service';
import { CategoryService } from '../categories/category.service';
import { RecurringPaymentService } from './recurring-payment.service';
import { NumericFormatterDirective } from '../../shared/directives/numeric-formatter.directive';

@Component({
  selector: 'app-mark-recurring-paid',
  standalone: true,
  imports: [FormsModule, RouterLink, NumericFormatterDirective],
  template: `
    <section class="mx-auto max-w-md px-5 py-6">
      <a routerLink="/app/recurring-payments" class="text-sm font-medium text-neutral-600">Volver a pagos</a>
      <h1 class="mt-5 text-2xl font-semibold text-neutral-950">Confirmar pago</h1>
      @if (payment()) {
        <p class="mt-2 text-sm text-neutral-500">{{ payment()?.name }}</p>
      }

      @if (loading()) {
        <p class="mt-6 text-sm text-neutral-500">Cargando informacion...</p>
      } @else {
        <form class="mt-7 space-y-5" (ngSubmit)="submit()">
          <label class="block">
            <span class="text-sm font-medium text-neutral-800">Monto pagado</span>
            <input name="amount" [(ngModel)]="amount" appNumericFormatter required class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-neutral-800">Cuenta</span>
            <select name="accountId" [(ngModel)]="accountId" required class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600">
              <option value="">Selecciona una cuenta</option>
              @for (account of accounts(); track account.id) {
                <option [value]="account.id">{{ account.name }}</option>
              }
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-neutral-800">Categoria</span>
            <select name="categoryId" [(ngModel)]="categoryId" required class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600">
              <option value="">Selecciona una categoria</option>
              @for (category of categories(); track category.id) {
                <option [value]="category.id">{{ category.name }}</option>
              }
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-neutral-800">Fecha de pago</span>
            <input name="paymentDate" [(ngModel)]="paymentDate" type="date" required class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600" />
          </label>

          @if (error()) {
            <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
          }
          <button type="submit" [disabled]="saving()" class="w-full rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {{ saving() ? 'Confirmando...' : 'Confirmar pago' }}
          </button>
        </form>
      }
    </section>
  `,
})
export class MarkRecurringPaidComponent implements OnInit {
  private readonly service = inject(RecurringPaymentService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly payment = signal<RecurringPayment | null>(null);
  readonly accounts = signal<Account[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  amount = 0;
  accountId = '';
  categoryId = '';
  paymentDate = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    void this.load();
  }

  async submit(): Promise<void> {
    const payment = this.payment();
    if (!payment || this.amount <= 0 || !this.accountId || !this.categoryId) {
      this.error.set('Completa monto, cuenta y categoria.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      await this.service.markAsPaid({
        recurringPaymentId: payment.id,
        amount: this.amount,
        accountId: this.accountId,
        categoryId: this.categoryId,
        paymentDate: new Date(`${this.paymentDate}T12:00:00`).toISOString(),
      });
      alert('¡Pago confirmado con éxito! Se ha registrado el gasto y actualizado el próximo vencimiento.');
      await this.router.navigateByUrl('/app/recurring-payments');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible confirmar el pago.');
    } finally {
      this.saving.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      const recurringPaymentId = this.route.snapshot.paramMap.get('id');
      if (!recurringPaymentId) {
        throw new Error('Pago recurrente invalido.');
      }
      const [payment, accounts, categories] = await Promise.all([
        this.service.getById(recurringPaymentId),
        this.accountService.listActive(),
        this.categoryService.listActive(),
      ]);
      this.payment.set(payment);
      this.accounts.set(accounts);
      this.categories.set(categories);
      this.amount = payment.expectedAmount;
      this.accountId = payment.suggestedAccountId ?? '';
      this.categoryId = payment.suggestedCategoryId ?? '';
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar el pago.');
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }
}
