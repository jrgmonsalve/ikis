import { Injectable, computed, signal } from '@angular/core';
import { ReportPeriodType, resolveDatePeriod } from '../../shared/utils/period';

const storageKey = 'ikis.period';

export interface PeriodState {
  periodType: ReportPeriodType;
  month: number;
  year: number;
  customStart: string;
  customEnd: string;
}

@Injectable({ providedIn: 'root' })
export class PeriodService {
  private readonly stateSignal = signal<PeriodState>(this.loadState());

  readonly state = this.stateSignal.asReadonly();

  readonly activePeriod = computed(() => {
    const s = this.stateSignal();
    return resolveDatePeriod(s.periodType, s.year, s.month, s.customStart, s.customEnd);
  });

  update(newState: Partial<PeriodState>): void {
    const current = this.stateSignal();
    const updated = { ...current, ...newState };
    this.stateSignal.set(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  private loadState(): PeriodState {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback to default
      }
    }
    const today = new Date();
    return {
      periodType: 'monthly',
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      customStart: today.toISOString().slice(0, 10),
      customEnd: today.toISOString().slice(0, 10),
    };
  }
}
