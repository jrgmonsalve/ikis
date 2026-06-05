import { Component, input } from '@angular/core';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  template: `
    <section class="px-5 py-6">
      <h1 class="text-2xl font-semibold text-neutral-950">{{ title() }}</h1>
      <p class="mt-2 text-sm leading-6 text-neutral-600">{{ description() }}</p>
    </section>
  `,
})
export class PlaceholderPageComponent {
  readonly title = input.required<string>();
  readonly description = input('Pendiente de implementar en el siguiente incremento vertical.');
}
