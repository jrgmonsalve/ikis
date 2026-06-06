import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { FamilyMember, Invitation } from '../../shared/models/domain.models';
import { FamilyMembersService } from './family-members.service';

@Component({
  selector: 'app-family-members',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="space-y-6 px-5 py-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-950">Miembros</h1>
        </div>
        @if (isOwner()) {
          <a routerLink="/app/family-members/invite" class="rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white">
            Invitar
          </a>
        }
      </div>

      @if (loading()) {
        <p class="text-sm text-neutral-500">Cargando miembros...</p>
      } @else if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
      } @else {
        <div>
          <h2 class="text-lg font-semibold text-neutral-950">Personas</h2>
          <div class="mt-3 divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
            @for (member of members(); track member.id) {
              <div class="flex items-center justify-between gap-4 px-4 py-3">
                <div class="min-w-0">
                  <p class="truncate font-medium text-neutral-900">{{ member.displayName }}</p>
                  <p class="truncate text-sm text-neutral-500">{{ member.email || member.userId }}</p>
                </div>
                <span class="rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">{{ roleLabel(member.role) }}</span>
              </div>
            }
          </div>
        </div>

        @if (isOwner()) {
          <div>
            <h2 class="text-lg font-semibold text-neutral-950">Invitaciones pendientes</h2>
            <div class="mt-3 space-y-3">
              @for (invitation of invitations(); track invitation.id) {
                <article class="rounded-lg border border-neutral-200 bg-white p-4">
                  <div class="flex justify-between gap-4">
                    <div class="min-w-0">
                      <p class="truncate font-medium text-neutral-900">{{ invitation.email }}</p>
                      <p class="mt-1 text-sm text-neutral-500">{{ roleLabel(invitation.role) }}</p>
                    </div>
                    <button type="button" class="text-sm font-semibold text-emerald-700" (click)="copy(invitation)">
                      Copiar enlace
                    </button>
                  </div>
                </article>
              } @empty {
                <p class="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">
                  No hay invitaciones pendientes.
                </p>
              }
            </div>
          </div>
        }

        @if (copyMessage()) {
          <p class="text-sm text-emerald-700">{{ copyMessage() }}</p>
        }
      }
    </section>
  `,
})
export class FamilyMembersComponent {
  private readonly service = inject(FamilyMembersService);
  private readonly selectedFamily = inject(SelectedFamilyService);
  private readonly i18n = inject(I18nService);

  readonly members = signal<FamilyMember[]>([]);
  readonly invitations = signal<Invitation[]>([]);
  readonly familyName = signal('');
  readonly isOwner = signal(false);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly copyMessage = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  roleLabel(role: string): string {
    return this.i18n.translate(
      role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Miembro',
    );
  }

  async copy(invitation: Invitation): Promise<void> {
    await navigator.clipboard.writeText(this.service.invitationUrl(invitation));
    this.copyMessage.set('Enlace copiado.');
  }

  private async load(): Promise<void> {
    try {
      const context = await this.selectedFamily.load();
      this.familyName.set(context.family.name);
      this.isOwner.set(context.membership.role === 'owner');
      const members = await this.service.listMembers();
      this.members.set(members);
      if (context.membership.role === 'owner') {
        this.invitations.set(await this.service.listPendingInvitations());
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar miembros.');
    } finally {
      this.loading.set(false);
    }
  }
}
