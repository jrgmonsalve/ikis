export type ReportPeriodType = 'monthly' | 'yearly' | 'custom';

export interface DatePeriod {
  startDate: Date;
  endDate: Date;
}

export function resolveDatePeriod(
  periodType: ReportPeriodType,
  year: number,
  month: number,
  customStart: string,
  customEnd: string,
): DatePeriod {
  if (periodType === 'monthly') {
    return {
      startDate: new Date(year, month - 1, 1, 0, 0, 0, 0),
      endDate: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }
  if (periodType === 'yearly') {
    return {
      startDate: new Date(year, 0, 1, 0, 0, 0, 0),
      endDate: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }

  return {
    startDate: new Date(`${customStart}T00:00:00`),
    endDate: new Date(`${customEnd}T23:59:59.999`),
  };
}
