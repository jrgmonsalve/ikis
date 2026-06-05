import { Injectable, signal } from '@angular/core';

const selectedFamilyKey = 'ikis.selectedFamilyId';

@Injectable({ providedIn: 'root' })
export class FamilyContextService {
  private readonly selectedFamilyIdSignal = signal<string | null>(
    localStorage.getItem(selectedFamilyKey),
  );

  readonly selectedFamilyId = this.selectedFamilyIdSignal.asReadonly();

  selectFamily(familyId: string): void {
    localStorage.setItem(selectedFamilyKey, familyId);
    this.selectedFamilyIdSignal.set(familyId);
  }

  clear(): void {
    localStorage.removeItem(selectedFamilyKey);
    this.selectedFamilyIdSignal.set(null);
  }
}
