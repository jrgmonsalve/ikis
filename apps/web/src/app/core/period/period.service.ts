import { Injectable, computed, signal } from '@angular/core';
import { ActivePeriod } from '../../shared/models/domain.models';
import {
  PeriodState,
  activePeriodToState,
  defaultPeriodState,
  periodStateEquals,
  resolvePeriodState,
} from '../../shared/utils/period';

@Injectable({ providedIn: 'root' })
export class PeriodService {
  private readonly stateSignal = signal<PeriodState>(defaultPeriodState());

  readonly state = this.stateSignal.asReadonly();

  readonly activePeriod = computed(() => {
    return resolvePeriodState(this.stateSignal());
  });

  update(newState: Partial<PeriodState>): void {
    const current = this.stateSignal();
    const updated = { ...current, ...newState };
    this.stateSignal.set(updated);
  }

  setFromActivePeriod(activePeriod?: ActivePeriod | null): void {
    const next = activePeriodToState(activePeriod);
    if (!periodStateEquals(this.stateSignal(), next)) {
      this.stateSignal.set(next);
    }
  }
}
