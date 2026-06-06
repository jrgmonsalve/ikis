import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Currency, RecurringPayment } from '../../shared/models/domain.models';
import { formatCurrency } from '../../shared/utils/formatters';
import { RecurringPaymentService } from './recurring-payment.service';

const frequencyLabels: Record<RecurringPayment['frequency'], string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  yearly: 'Anual',
  custom: 'Personalizado',
};

@Component({
  selector: 'app-recurring-payments-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="space-y-6 px-5 py-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-950">Pagos recurrentes</h1>
        </div>
        @if (canManage()) {
          <a routerLink="/app/recurring-payments/new" class="rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white">
            Crear
          </a>
        }
      </div>

      @if (loading()) {
        <p class="text-sm text-neutral-500">Cargando pagos...</p>
      } @else if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
      } @else {
        <div class="space-y-3">
          @for (payment of payments(); track payment.id) {
            <article class="rounded-lg border border-neutral-200 bg-white p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 flex items-start gap-3">
                  <span class="mt-1 flex-shrink-0">
                    @switch (getStatus(payment)) {
                      @case ('paid') {
                        <i class="fa-solid fa-circle-check text-emerald-600 text-lg" title="Pagado"></i>
                      }
                      @case ('overdue') {
                        <i class="fa-solid fa-circle-xmark text-red-600 text-lg" title="Vencido"></i>
                      }
                      @default {
                        <i class="fa-solid fa-circle-exclamation text-amber-500 text-lg" title="Pendiente"></i>
                      }
                    }
                  </span>
                  <div class="min-w-0">
                    <h2 class="truncate font-medium text-neutral-950">{{ payment.name }}</h2>
                    <p class="mt-1 text-sm text-neutral-500">
                      {{ paymentSummary(payment) }}
                    </p>
                  </div>
                </div>
                <p class="font-semibold text-neutral-950">{{ money(payment.expectedAmount) }}</p>
              </div>
              
              <div class="mt-4 flex gap-2">
                @if (getStatus(payment) === 'paid') {
                  <button
                    disabled
                    class="flex-1 rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-2 text-center text-sm font-semibold text-neutral-400 cursor-not-allowed"
                  >
                    Pago completado
                  </button>
                } @else {
                  <a
                    [routerLink]="['/app/recurring-payments', payment.id, 'pay']"
                    class="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-center text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                  >
                    Marcar como pagado
                  </a>
                }
                @if (canManage()) {
                  <a
                    [routerLink]="['/app/recurring-payments', payment.id, 'edit']"
                    class="rounded-lg border border-neutral-300 px-3 py-2 text-center text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                    title="Editar"
                  >
                    <i class="fa-solid fa-pen"></i>
                  </a>
                }
              </div>
            </article>
          } @empty {
            <div class="rounded-lg border border-dashed border-neutral-300 px-5 py-10 text-center">
              <p class="font-medium text-neutral-800">No hay pagos recurrentes</p>
              <p class="mt-2 text-sm text-neutral-500">Agrega obligaciones para ver sus proximos vencimientos.</p>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class RecurringPaymentsListComponent {
  private readonly service = inject(RecurringPaymentService);
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly i18n = inject(I18nService);

  readonly payments = signal<RecurringPayment[]>([]);
  readonly familyName = signal('');
  readonly canManage = signal(false);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private currency: Currency = 'COP';

  constructor() {
    void this.load();
  }

  money(value: number): string {
    return formatCurrency(value, this.currency);
  }

  frequencyLabel(frequency: RecurringPayment['frequency']): string {
    return this.i18n.translate(frequencyLabels[frequency]);
  }

  paymentSummary(payment: RecurringPayment): string {
    const frequency = this.frequencyLabel(payment.frequency);
    const due = this.i18n.translate('vence');
    const date = payment.nextDueDate.toDate().toLocaleDateString(this.i18n.locale());
    return `${frequency} · ${due} ${date}`;
  }

  getStatus(payment: RecurringPayment): 'overdue' | 'paid' | 'pending' {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextDue = payment.nextDueDate.toDate();
    nextDue.setHours(0, 0, 0, 0);

    if (nextDue.getTime() < today.getTime()) {
      return 'overdue';
    }

    if (this.isPaidInCurrentPeriod(payment)) {
      return 'paid';
    }

    return 'pending';
  }

  isPaidInCurrentPeriod(payment: RecurringPayment): boolean {
    if (!payment.lastPaidAt) return false;
    const lastPaid = payment.lastPaidAt.toDate();
    const today = new Date();

    lastPaid.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    switch (payment.frequency) {
      case 'weekly': {
        const diffTime = Math.abs(today.getTime() - lastPaid.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      case 'biweekly': {
        const diffTime = Math.abs(today.getTime() - lastPaid.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 14;
      }
      case 'monthly': {
        return lastPaid.getMonth() === today.getMonth() && 
               lastPaid.getFullYear() === today.getFullYear();
      }
      case 'yearly': {
        return lastPaid.getFullYear() === today.getFullYear();
      }
      default:
        return false;
    }
  }

  private async load(): Promise<void> {
    try {
      const [context, payments] = await Promise.all([
        this.selectedFamily.load(),
        this.service.listActive(),
      ]);
      this.familyName.set(context.family.name);
      this.currency = context.family.mainCurrency;
      this.canManage.set(['owner', 'admin'].includes(context.membership.role));
      this.payments.set(payments);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar los pagos.');
    } finally {
      this.loading.set(false);
    }
  }
}
