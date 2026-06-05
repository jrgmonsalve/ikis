import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  template: `
    <main class="min-h-screen bg-neutral-950 text-white">
      <section class="mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-6 py-8">
        <div class="pt-12">
          <p class="text-sm font-medium uppercase tracking-[0.18em] text-emerald-300">IKIS</p>
          <h1 class="mt-5 text-4xl font-semibold leading-tight">Control financiero personal y familiar.</h1>
          <p class="mt-4 text-base leading-7 text-neutral-300">
            Registra gastos, revisa saldos y entiende tu presupuesto desde el celular.
          </p>
        </div>

        <button
          type="button"
          class="mb-8 flex w-full items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-neutral-950 shadow-sm transition hover:bg-emerald-50"
          (click)="signIn()"
        >
          Sign in with Google
        </button>
      </section>
    </main>
  `,
})
export class SignInComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async signIn(): Promise<void> {
    await this.auth.signInWithGoogle();
    await this.router.navigateByUrl('/select-family');
  }
}
