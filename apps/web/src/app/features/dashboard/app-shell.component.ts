import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { FamilyContextService } from '../../core/family-context/family-context.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-neutral-50 pb-20 text-neutral-950">
      <header class="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-5 py-3 backdrop-blur">
        <div class="mx-auto flex max-w-3xl items-center justify-between">
          <button type="button" class="text-left" routerLink="/select-family">
            <span class="block text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">IKIS</span>
            <span class="block max-w-48 truncate text-sm text-neutral-500">
              {{ familyContext.selectedFamilyId() || 'Seleccionar familia' }}
            </span>
          </button>
          <button type="button" class="text-sm font-medium text-neutral-700" (click)="logout()">Salir</button>
        </div>
      </header>

      <main class="mx-auto max-w-3xl">
        <router-outlet />
      </main>

      <nav class="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white">
        <div class="mx-auto grid max-w-3xl grid-cols-5 text-xs font-medium text-neutral-500">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="text-emerald-700"
              class="flex h-16 items-center justify-center px-1 text-center"
            >
              {{ item.label }}
            </a>
          }
        </div>
      </nav>
    </div>
  `,
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly familyContext = inject(FamilyContextService);

  readonly navItems = [
    { path: '/app/dashboard', label: 'Dashboard' },
    { path: '/app/transactions', label: 'Movimientos' },
    { path: '/app/budgets', label: 'Budgets' },
    { path: '/app/reports', label: 'Reports' },
    { path: '/app/more', label: 'More' },
  ];

  async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/sign-in');
  }
}
