import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

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

        <div class="mb-8 space-y-3">
          <button
            type="button"
            class="flex w-full items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-neutral-950 shadow-sm transition hover:bg-emerald-50"
            (click)="signIn()"
          >
            Sign in with Google
          </button>

          @if (showDevelopmentSignIn) {
            <button
              type="button"
              class="flex w-full items-center justify-center rounded-lg border border-emerald-400 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-950"
              (click)="signInForDevelopment()"
            >
              Entrar en desarrollo
            </button>
          }

          @if (errorMessage()) {
            <p class="rounded-lg border border-red-400/40 bg-red-950/60 px-3 py-2 text-sm text-red-100">
              {{ errorMessage() }}
            </p>
          }
        </div>
      </section>
    </main>
  `,
})
export class SignInComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly showDevelopmentSignIn = environment.useEmulators;
  readonly errorMessage = signal<string | null>(null);

  async signIn(): Promise<void> {
    await this.runSignIn(() => this.auth.signInWithGoogle());
  }

  async signInForDevelopment(): Promise<void> {
    await this.runSignIn(() => this.auth.signInForDevelopment());
  }

  private async runSignIn(action: () => Promise<void>): Promise<void> {
    this.errorMessage.set(null);

    try {
      await action();
      await this.router.navigateByUrl(
        resolvePostSignInUrl(this.route.snapshot.queryParamMap.get('returnUrl')),
      );
    } catch {
      this.errorMessage.set(
        environment.useEmulators
          ? 'No se pudo conectar con Firebase Emulator. Ejecuta npm run dev desde la raiz del proyecto.'
          : 'No se pudo iniciar sesion. Intenta nuevamente.',
      );
    }
  }
}

export function resolvePostSignInUrl(returnUrl: string | null): string {
  if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
    return '/select-family';
  }

  return returnUrl === '/sign-in' || returnUrl.startsWith('/sign-in?')
    ? '/select-family'
    : returnUrl;
}
