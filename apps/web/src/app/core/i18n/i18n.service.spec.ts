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
    expect(service.translate('El rango de fechas no es valido.')).toBe('The date range is invalid.');
    expect(service.resolveSource('Settings', 'Configuracion')).toBe('Configuracion');
    expect(service.locale()).toBe('en-US');
    expect(localStorage.getItem('ikis.language')).toBe('en');
    expect(document.documentElement.lang).toBe('en');

    service.setLanguage('es');

    expect(service.translate(service.resolveSource('Settings'))).toBe('Configuracion');
    expect(service.locale()).toBe('es-CO');
  });

  it('translates dashboard budget summary and subcategory labels to English', () => {
    const service = TestBed.inject(I18nService);

    service.setLanguage('en');

    expect(service.translate('Resumen presupuestal')).toBe('Budget summary');
    expect(service.translate('Total presupuesto')).toBe('Total budget');
    expect(service.translate('Saldo esperado')).toBe('Expected balance');
    expect(service.translate('Subcategorias')).toBe('Subcategories');
    expect(service.translate('Selecciona una subcategoria.')).toBe('Select a subcategory.');
    expect(service.translate('Desactivar esta subcategoria?')).toBe('Deactivate this subcategory?');
    expect(service.translate('Cerrar sesion')).toBe('Sign out');
    expect(service.translate('Abrir menu de perfil')).toBe('Open profile menu');
    expect(service.translate('Los movimientos de pagos recurrentes no se pueden editar. Puedes cancelarlos desde el historial.')).toBe('Recurring payment transactions cannot be edited. You can cancel them from the history.');
    expect(service.translate('¿Estás seguro de que deseas cancelar este movimiento? Esto revertirá los cambios en los saldos de tus cuentas.')).toBe('Are you sure you want to cancel this transaction? This will reverse the changes in your account balances.');
  });
});
