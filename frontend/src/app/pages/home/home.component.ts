import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <section class="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-12">
      <div class="max-w-2xl">
        <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">Expense Control</p>
        <h1 class="mt-3 text-4xl font-semibold text-slate-950 sm:text-5xl">Personal expense tracking scaffold</h1>
        <p class="mt-5 text-lg leading-8 text-slate-700">
          Angular PWA shell with Cognito and API service placeholders ready for the first product screen.
        </p>
        @if (statusMessage) {
          <p class="mt-5 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900">
            {{ statusMessage }}
          </p>
        }
        <div class="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"
            (click)="auth.login()"
          >
            Sign in
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
            (click)="auth.logout()"
          >
            Sign out
          </button>
        </div>
      </div>
    </section>
  `
})
export class HomeComponent implements OnInit {
  readonly auth = inject(AuthService);
  statusMessage = '';

  async ngOnInit(): Promise<void> {
    try {
      const handledCallback = await this.auth.handleRedirectCallback();
      if (handledCallback || this.auth.isAuthenticated()) {
        this.statusMessage = 'Signed in successfully.';
      }
    } catch (error) {
      this.statusMessage = error instanceof Error ? error.message : 'Sign-in callback failed.';
    }
  }
}
