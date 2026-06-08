import { Timestamp } from 'firebase/firestore';

import { ActivePeriod, ActivePeriodType } from '../models/domain.models';

export type ReportPeriodType = ActivePeriodType;

export interface PeriodState {
  periodType: ReportPeriodType;
  month: number;
  year: number;
  customStart: string;
  customEnd: string;
}

export interface DatePeriod {
  startDate: Date;
  endDate: Date;
}

export function defaultPeriodState(today = new Date()): PeriodState {
  return {
    periodType: 'monthly',
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    customStart: today.toISOString().slice(0, 10),
    customEnd: today.toISOString().slice(0, 10),
  };
}

export function activePeriodToState(activePeriod?: ActivePeriod | null): PeriodState {
  const fallback = defaultPeriodState();
  if (!activePeriod) {
    return fallback;
  }

  if (activePeriod.periodType === 'yearly') {
    return {
      ...fallback,
      periodType: 'yearly',
      year: activePeriod.year ?? fallback.year,
    };
  }

  if (activePeriod.periodType === 'custom') {
    return {
      ...fallback,
      periodType: 'custom',
      customStart: activePeriod.customStart?.toDate().toISOString().slice(0, 10) ?? fallback.customStart,
      customEnd: activePeriod.customEnd?.toDate().toISOString().slice(0, 10) ?? fallback.customEnd,
    };
  }

  return {
    ...fallback,
    periodType: 'monthly',
    month: activePeriod.month ?? fallback.month,
    year: activePeriod.year ?? fallback.year,
  };
}

export function stateToActivePeriod(state: PeriodState): ActivePeriod {
  if (state.periodType === 'custom') {
    return {
      periodType: 'custom',
      month: null,
      year: null,
      customStart: Timestamp.fromDate(new Date(`${state.customStart}T00:00:00`)),
      customEnd: Timestamp.fromDate(new Date(`${state.customEnd}T23:59:59.999`)),
    };
  }

  if (state.periodType === 'yearly') {
    return {
      periodType: 'yearly',
      month: null,
      year: state.year,
      customStart: null,
      customEnd: null,
    };
  }

  return {
    periodType: 'monthly',
    month: state.month,
    year: state.year,
    customStart: null,
    customEnd: null,
  };
}

export function periodStateEquals(left: PeriodState, right: PeriodState): boolean {
  return left.periodType === right.periodType
    && left.month === right.month
    && left.year === right.year
    && left.customStart === right.customStart
    && left.customEnd === right.customEnd;
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

export function resolvePeriodState(state: PeriodState): DatePeriod {
  return resolveDatePeriod(
    state.periodType,
    state.year,
    state.month,
    state.customStart,
    state.customEnd,
  );
}

export function formatPeriodState(state: PeriodState, locale = 'es'): string {
  if (state.periodType === 'monthly') {
    const date = new Date(state.year, state.month - 1, 1);
    const month = date.toLocaleDateString(locale, { month: 'long' });
    return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${state.year}`;
  }

  if (state.periodType === 'yearly') {
    return state.year.toString();
  }

  const start = new Date(`${state.customStart}T00:00:00`).toLocaleDateString(locale);
  const end = new Date(`${state.customEnd}T00:00:00`).toLocaleDateString(locale);
  return `${start} - ${end}`;
}
