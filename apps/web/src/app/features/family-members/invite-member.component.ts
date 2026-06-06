import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Invitation } from '../../shared/models/domain.models';
import { FamilyMembersService } from './family-members.service';

@Component({
  selector: 'app-invite-member',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="mx-auto max-w-md px-5 py-6">
      <a routerLink="/app/family-members" class="text-sm font-medium text-neutral-600">Volver a miembros</a>
      <h1 class="mt-5 text-2xl font-semibold text-neutral-950">Invitar miembro</h1>

      <form class="mt-7 space-y-5" (ngSubmit)="submit()">
        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Correo</span>
          <input name="email" [(ngModel)]="email" type="email" required class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600" />
        </label>
        <label class="block">
          <span class="text-sm font-medium text-neutral-800">Rol</span>
          <select name="role" [(ngModel)]="role" class="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 outline-none focus:border-emerald-600">
            <option value="member">Miembro</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        @if (error()) {
          <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
        }
        <button type="submit" [disabled]="saving()" class="w-full rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {{ saving() ? 'Creando...' : 'Crear invitacion' }}
        </button>
      </form>

      @if (createdInvitation()) {
        <div class="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p class="font-medium text-emerald-900">Invitacion creada</p>
          <p class="mt-2 break-all text-sm text-emerald-800">{{ invitationUrl() }}</p>
          <button type="button" class="mt-4 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white" (click)="copy()">
            Copiar enlace
          </button>
        </div>
      }
    </section>
  `,
})
export class InviteMemberComponent {
  private readonly service = inject(FamilyMembersService);

  email = '';
  role: 'admin' | 'member' = 'member';
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly createdInvitation = signal<Invitation | null>(null);
  readonly invitationUrl = signal('');

  async submit(): Promise<void> {
    if (!this.email.trim() || !this.email.includes('@')) {
      this.error.set('Ingresa un correo valido.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      const invitation = await this.service.createInvitation(this.email, this.role);
      this.createdInvitation.set(invitation);
      this.invitationUrl.set(this.service.invitationUrl(invitation));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible crear la invitacion.');
    } finally {
      this.saving.set(false);
    }
  }

  async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.invitationUrl());
  }
}
