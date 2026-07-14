export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function todayDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
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
