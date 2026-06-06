import { Injectable, signal } from '@angular/core';

import { UserLanguage } from '../../shared/models/domain.models';

const storageKey = 'ikis.language';

const english: Record<string, string> = {
  'Aceptar invitacion': 'Accept invitation',
  'Administracion de la familia': 'Family management',
  'Agregar ingreso': 'Add income',
  'Agregar gasto': 'Add expense',
  'Agregar transferencia': 'Add transfer',
  'Atras': 'Back',
  'Balance disponible': 'Available balance',
  'Cargando...': 'Loading...',
  'Cargando configuracion...': 'Loading settings...',
  'Cargando cuentas...': 'Loading accounts...',
  'Cargando categorias...': 'Loading categories...',
  'Cargando datos...': 'Loading data...',
  'Cargando familias...': 'Loading families...',
  'Cargando miembros...': 'Loading members...',
  'Cargando pagos...': 'Loading payments...',
  'Cargando presupuestos...': 'Loading budgets...',
  'Cargando reportes...': 'Loading reports...',
  'Cargando cuentas y categorias...': 'Loading accounts and categories...',
  'Categoria': 'Category',
  'Categoria sugerida': 'Suggested category',
  'Categorias': 'Categories',
  'Cerrar sesion': 'Sign out',
  'Clasificacion de movimientos': 'Transaction classification',
  'Configuracion': 'Settings',
  'Configuracion guardada.': 'Settings saved.',
  'Configuracion y administracion de la familia.': 'Family settings and management.',
  'Control financiero personal y familiar.': 'Personal and family financial control.',
  'Correo electronico': 'Email address',
  'Crear': 'Create',
  'Crear cuenta': 'Create account',
  'Crear categoria': 'Create category',
  'Crear familia': 'Create family',
  'Crear invitacion': 'Create invitation',
  'Crear pago recurrente': 'Create recurring payment',
  'Crear presupuesto': 'Create budget',
  'Creando...': 'Creating...',
  'Cuenta': 'Account',
  'Cuenta destino': 'Destination account',
  'Cuenta origen': 'Source account',
  'Cuenta sugerida': 'Suggested account',
  'Cuentas': 'Accounts',
  'Disponible': 'Available',
  'Efectivo': 'Cash',
  'Entrar en desarrollo': 'Enter development mode',
  'Espanol': 'Spanish',
  'Este sera tu espacio financiero principal.': 'This will be your main financial workspace.',
  'Fecha': 'Date',
  'Fecha de pago': 'Payment date',
  'Frecuencia': 'Frequency',
  'Gastos': 'Expenses',
  'Guardar cambios': 'Save changes',
  'Guardar movimiento': 'Save transaction',
  'Guardar pago recurrente': 'Save recurring payment',
  'Guardar presupuesto': 'Save budget',
  'Guardando...': 'Saving...',
  'Idioma preferido': 'Preferred language',
  'Ingresos': 'Income',
  'Invitacion creada': 'Invitation created',
  'Invitar miembro': 'Invite member',
  'Mas': 'More',
  'Mensual': 'Monthly',
  'Miembro': 'Member',
  'Miembros': 'Members',
  'Moneda principal': 'Main currency',
  'Monto': 'Amount',
  'Monto esperado': 'Expected amount',
  'Movimientos': 'Transactions',
  'No hay categorias activas.': 'There are no active categories.',
  'No hay cuentas activas.': 'There are no active accounts.',
  'No hay miembros activos.': 'There are no active members.',
  'No hay pagos recurrentes activos.': 'There are no active recurring payments.',
  'No hay presupuestos activos.': 'There are no active budgets.',
  'No tienes familias activas todavia.': 'You do not have active families yet.',
  'Nombre': 'Name',
  'Nombre de la familia': 'Family name',
  'Obligaciones proximas': 'Upcoming obligations',
  'Pagado': 'Paid',
  'Pagos recurrentes': 'Recurring payments',
  'Para continuar debes iniciar sesion.': 'You must sign in to continue.',
  'Perfil': 'Profile',
  'Perfil y preferencias de la familia activa.': 'Profile and active family preferences.',
  'Periodo': 'Period',
  'Personas y roles de la familia': 'Family members and roles',
  'Presupuestos': 'Budgets',
  'Proximo vencimiento': 'Next due date',
  'Registra gastos, revisa saldos y entiende tu presupuesto desde el celular.':
    'Track expenses, review balances, and understand your budget from your phone.',
  'Reportes': 'Reports',
  'Resumen': 'Dashboard',
  'Rol': 'Role',
  'Saldos y tipos de cuenta': 'Balances and account types',
  'Salir': 'Sign out',
  'Selecciona una categoria': 'Select a category',
  'Selecciona una cuenta': 'Select an account',
  'Selecciona una familia': 'Select a family',
  'Seleccionar familia': 'Select family',
  'Semanal': 'Weekly',
  'Sin categoria': 'Uncategorized',
  'Tipo': 'Type',
  'Transferencia': 'Transfer',
  'Volver a categorias': 'Back to categories',
  'Volver a cuentas': 'Back to accounts',
  'Volver a miembros': 'Back to members',
  'Volver a movimientos': 'Back to transactions',
  'Volver a pagos': 'Back to payments',
  'Volver a presupuestos': 'Back to budgets',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly languageSignal = signal<UserLanguage>(
    (localStorage.getItem(storageKey) as UserLanguage | null) ?? 'es',
  );

  readonly language = this.languageSignal.asReadonly();

  setLanguage(language: UserLanguage): void {
    localStorage.setItem(storageKey, language);
    document.documentElement.lang = language;
    this.languageSignal.set(language);
  }

  translate(source: string): string {
    return this.languageSignal() === 'en' ? (english[source] ?? source) : source;
  }

  resolveSource(value: string, previousSource?: string): string {
    if (
      previousSource &&
      (value === previousSource || value === (english[previousSource] ?? previousSource))
    ) {
      return previousSource;
    }

    return (
      Object.entries(english).find(
        ([source, translation]) => value === source || value === translation,
      )?.[0] ?? value
    );
  }
}
