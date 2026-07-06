export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export function currentCycleRange(cycleStartDay: number, today = new Date()): { start: Date; end: Date } {
  const anchor = new Date(today.getFullYear(), today.getMonth(), cycleStartDay);
  const start = today.getDate() >= cycleStartDay ? anchor : new Date(today.getFullYear(), today.getMonth() - 1, cycleStartDay);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
  return { start, end };
}

export function daysUntil(date: Date, today = new Date()): number {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.max(0, Math.round((startOfDate.getTime() - startOfToday.getTime()) / 86_400_000));
}

export function formatCycleRange(start: Date, end: Date, locale: string): string {
  const inclusiveEnd = new Date(end.getTime() - 86_400_000);
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  return `${formatter.format(start)} – ${formatter.format(inclusiveEnd)}`;
}
