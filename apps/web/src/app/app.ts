import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TranslatePageDirective } from './core/i18n/translate-page.directive';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslatePageDirective],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
