export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function cycleRangeFromDates(start: string, endInclusive: string): { start: Date; end: Date } {
  const end = new Date(`${endInclusive}T00:00:00`);
  end.setDate(end.getDate() + 1);
  return { start: new Date(`${start}T00:00:00`), end };
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
