import { Currency } from '../models/domain.models';

export function formatCurrency(value: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === 'COP' ? 'es-CO' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'COP' ? 0 : 2,
  }).format(value);
}

export function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase();
}
