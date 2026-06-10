import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { FamilyContextService } from '../../core/family-context/family-context.service';
import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';

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
              {{ familyName() || t('Seleccionar familia') }}
            </span>
          </button>
          <div class="relative">
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold uppercase text-white"
              (click)="toggleProfileMenu()"
              [attr.aria-label]="t('Abrir menu de perfil')"
              [attr.aria-expanded]="profileMenuOpen()"
            >
              {{ profileInitials() }}
            </button>

            @if (profileMenuOpen()) {
              <div class="absolute right-0 mt-2 w-64 rounded-lg border border-neutral-200 bg-white p-4 text-left shadow-lg">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">{{ t('Perfil') }}</p>
                <p class="mt-2 truncate text-sm font-semibold text-neutral-950">{{ profileName() }}</p>
                <p class="mt-1 text-xs text-neutral-500">{{ t('Rol') }}: {{ roleLabel(profileRole()) }}</p>
                <button
                  type="button"
                  class="mt-4 w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
                  (click)="logout()"
                >
                  {{ t('Cerrar sesion') }}
                </button>
              </div>
            }
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-3xl">
        <router-outlet />
      </main>

      <nav class="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white">
        <div class="mx-auto grid max-w-3xl grid-cols-5 text-neutral-500">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="text-emerald-700"
              #rla="routerLinkActive"
              [attr.aria-current]="rla.isActive ? 'page' : null"
              class="group flex h-16 flex-col items-center justify-center px-1 text-center transition-colors duration-200"
            >
              @switch (item.path) {
                @case ('/app/dashboard') {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="mb-1 h-5 w-5 transition-transform duration-200 group-hover:scale-110">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                }
                @case ('/app/transactions/expense') {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="mb-1 h-5 w-5 transition-transform duration-200 group-hover:scale-110">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                }
                @case ('/app/transactions/income') {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="mb-1 h-5 w-5 transition-transform duration-200 group-hover:scale-110">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                }
                @case ('/app/transactions/transfer') {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="mb-1 h-5 w-5 transition-transform duration-200 group-hover:scale-110">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                }
                @case ('/app/more') {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="mb-1 h-5 w-5 transition-transform duration-200 group-hover:scale-110">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                }
              }
              <span class="text-[10px] font-semibold tracking-tight whitespace-nowrap">
                {{ t(item.label) }}
              </span>
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
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly i18n = inject(I18nService);
  readonly familyName = signal('');
  readonly profileName = signal('Usuario');
  readonly profileRole = signal('member');
  readonly profileMenuOpen = signal(false);

  constructor() {
    void this.loadFamilyName();
  }

  readonly navItems = [
    { path: '/app/dashboard', label: 'Resumen' },
    { path: '/app/transactions/expense', label: 'Gasto' },
    { path: '/app/transactions/income', label: 'Ingreso' },
    { path: '/app/transactions/transfer', label: 'Transferir' },
    { path: '/app/more', label: 'Más' },
  ];

  private async loadFamilyName(): Promise<void> {
    if (!this.familyContext.selectedFamilyId()) {
      return;
    }

    try {
      const context = await this.selectedFamily.load();
      const user = this.auth.currentUser();
      this.familyName.set(context.family.name);
      this.profileName.set(user?.displayName || context.membership.displayName || user?.email || 'Usuario');
      this.profileRole.set(context.membership.role);
    } catch {
      this.familyName.set(this.t('Familia no disponible'));
    }
  }


  toggleProfileMenu(): void {
    this.profileMenuOpen.set(!this.profileMenuOpen());
  }

  profileInitials(): string {
    return this.profileName()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'U';
  }

  roleLabel(role: string): string {
    return this.t(role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Miembro');
  }

  t(source: string): string {
    return this.i18n.translate(source);
  }

  async logout(): Promise<void> {
    this.profileMenuOpen.set(false);
    await this.auth.signOut();
    await this.router.navigateByUrl('/sign-in');
  }
}
