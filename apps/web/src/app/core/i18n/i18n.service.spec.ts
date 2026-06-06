import { TestBed } from '@angular/core/testing';

import { I18nService } from './i18n.service';

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('uses Spanish by default and switches to English', () => {
    const service = TestBed.inject(I18nService);

    expect(service.translate('Configuracion')).toBe('Configuracion');

    service.setLanguage('en');

    expect(service.translate('Configuracion')).toBe('Settings');
    expect(service.resolveSource('Settings', 'Configuracion')).toBe('Configuracion');
    expect(localStorage.getItem('ikis.language')).toBe('en');
    expect(document.documentElement.lang).toBe('en');

    service.setLanguage('es');

    expect(service.translate(service.resolveSource('Settings'))).toBe('Configuracion');
  });
});
