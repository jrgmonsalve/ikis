import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Currency, UserLanguage, UserProfile } from '../../shared/models/domain.models';
import { SettingsService } from './settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="space-y-6 px-5 py-6">
      <div>
        <h1 class="text-2xl font-semibold text-neutral-950">Configuracion</h1>
        <p class="mt-2 text-sm text-neutral-500">Perfil y preferencias de la familia activa.</p>
      </div>

      @if (loading()) {
        <p class="text-sm text-neutral-500">Cargando configuracion...</p>
      } @else {
        <div class="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 class="font-semibold text-neutral-950">Perfil</h2>
          <p class="mt-3 text-sm text-neutral-800">{{ profile()?.displayName }}</p>
          <p class="mt-1 text-sm text-neutral-500">{{ profile()?.email || 'Usuario local de desarrollo' }}</p>
        </div>

        <form class="space-y-5 rounded-lg border border-neutral-200 bg-white p-4" (ngSubmit)="save()">
          <label class="block">
            <span class="text-sm font-medium text-neutral-800">Idioma preferido</span>
            <select name="language" [(ngModel)]="language" class="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-3">
              <option value="es">Espanol</option>
              <option value="en">English</option>
            </select>
          </label>

          <label class="block">
            <span class="text-sm font-medium text-neutral-800">Nombre de la familia</span>
            <input name="familyName" [(ngModel)]="familyName" [disabled]="!isOwner()" class="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-3 disabled:bg-neutral-100" />
          </label>

          <label class="block">
            <span class="text-sm font-medium text-neutral-800">Moneda principal</span>
            <input [value]="currency()" disabled class="mt-2 w-full rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-3" />
          </label>

          @if (message()) {
            <p class="text-sm text-emerald-700">{{ message() }}</p>
          }
          @if (error()) {
            <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
          }

          <button type="submit" [disabled]="saving()" class="w-full rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </form>

        <button type="button" class="w-full rounded-lg border border-red-300 px-4 py-3 text-sm font-semibold text-red-700" (click)="logout()">
          Cerrar sesion
        </button>
      }
    </section>
  `,
})
export class SettingsComponent {
  private readonly settings = inject(SettingsService);
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  readonly profile = signal<UserProfile | null>(null);
  readonly currency = signal<Currency>('COP');
  readonly isOwner = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  language: UserLanguage = 'es';
  familyName = '';

  constructor() {
    void this.load();
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    try {
      await this.settings.updateLanguage(this.language);
      this.i18n.setLanguage(this.language);
      if (this.isOwner()) {
        if (!this.familyName.trim()) {
          throw new Error('El nombre de la familia es obligatorio.');
        }
        await this.settings.updateFamilyName(this.familyName);
      }
      this.message.set('Configuracion guardada.');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible guardar.');
    } finally {
      this.saving.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/sign-in');
  }

  private async load(): Promise<void> {
    try {
      const [profile, context] = await Promise.all([
        this.settings.getProfile(),
        this.selectedFamily.load(),
      ]);
      this.profile.set(profile);
      this.language = profile.preferredLanguage;
      this.i18n.setLanguage(this.language);
      this.familyName = context.family.name;
      this.currency.set(context.family.mainCurrency);
      this.isOwner.set(context.membership.role === 'owner');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar configuracion.');
    } finally {
      this.loading.set(false);
    }
  }
}
