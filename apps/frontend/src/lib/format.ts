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

function cycleEndOfMonth(cycleEndDay: number, year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(cycleEndDay, lastDay));
}

export function cycleRangeFromDates(start: string, endInclusive: string): { start: Date; end: Date } {
  const end = new Date(`${endInclusive}T00:00:00`);
  end.setDate(end.getDate() + 1);
  return { start: new Date(`${start}T00:00:00`), end };
}

export function currentCycleRange(cycleEndDay: number, today = new Date()): { start: Date; end: Date } {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let endInclusive = cycleEndOfMonth(cycleEndDay, startOfToday.getFullYear(), startOfToday.getMonth());
  if (startOfToday > endInclusive) {
    endInclusive = cycleEndOfMonth(cycleEndDay, startOfToday.getFullYear(), startOfToday.getMonth() + 1);
  }
  const previousEnd = cycleEndOfMonth(cycleEndDay, endInclusive.getFullYear(), endInclusive.getMonth() - 1);
  const start = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), previousEnd.getDate() + 1);
  const end = new Date(endInclusive.getFullYear(), endInclusive.getMonth(), endInclusive.getDate() + 1);
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
