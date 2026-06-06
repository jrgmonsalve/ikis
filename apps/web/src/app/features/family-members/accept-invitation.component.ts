import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { FamilyContextService } from '../../core/family-context/family-context.service';
import { FamilyMembersService } from './family-members.service';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  template: `
    <main class="flex min-h-screen items-center justify-center bg-neutral-50 px-5">
      <section class="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6">
        <h1 class="text-2xl font-semibold text-neutral-950">Aceptar invitacion</h1>
        <p class="mt-2 text-sm text-neutral-500">Confirma para unirte a la familia con tu cuenta autenticada.</p>
        @if (error()) {
          <p class="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
        }
        <button type="button" [disabled]="accepting()" class="mt-6 w-full rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" (click)="accept()">
          {{ accepting() ? 'Aceptando...' : 'Aceptar invitacion' }}
        </button>
      </section>
    </main>
  `,
})
export class AcceptInvitationComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(FamilyMembersService);
  private readonly familyContext = inject(FamilyContextService);

  readonly accepting = signal(false);
  readonly error = signal<string | null>(null);

  async accept(): Promise<void> {
    const familyId = this.route.snapshot.queryParamMap.get('familyId');
    const invitationId = this.route.snapshot.queryParamMap.get('invitationId');
    if (!familyId || !invitationId) {
      this.error.set('El enlace de invitacion no es valido.');
      return;
    }

    this.accepting.set(true);
    this.error.set(null);
    try {
      const acceptedFamilyId = await this.service.acceptInvitation(familyId, invitationId);
      this.familyContext.selectFamily(acceptedFamilyId);
      await this.router.navigateByUrl('/app/dashboard');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible aceptar la invitacion.');
    } finally {
      this.accepting.set(false);
    }
  }
}
