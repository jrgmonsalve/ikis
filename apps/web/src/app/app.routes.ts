import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { SignInComponent } from './features/auth/sign-in.component';
import { AppShellComponent } from './features/dashboard/app-shell.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PlaceholderPageComponent } from './features/dashboard/placeholder-page.component';
import { CreateFamilyComponent } from './features/family/create-family.component';
import { SelectFamilyComponent } from './features/family/select-family.component';

export const routes: Routes = [
  { path: 'sign-in', component: SignInComponent },
  { path: 'create-family', component: CreateFamilyComponent, canActivate: [authGuard] },
  { path: 'select-family', component: SelectFamilyComponent, canActivate: [authGuard] },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'transactions',
        component: PlaceholderPageComponent,
        data: { title: 'Movimientos', description: 'Registro de gastos, ingresos y transferencias.' },
      },
      {
        path: 'budgets',
        component: PlaceholderPageComponent,
        data: { title: 'Presupuestos', description: 'Control de presupuesto por categoria y periodo.' },
      },
      {
        path: 'reports',
        component: PlaceholderPageComponent,
        data: { title: 'Reportes', description: 'Resumen por periodo, categoria, ingresos y gastos.' },
      },
      {
        path: 'more',
        component: PlaceholderPageComponent,
        data: { title: 'Mas', description: 'Cuentas, categorias, pagos recurrentes, miembros y configuracion.' },
      },
      {
        path: 'accounts',
        component: PlaceholderPageComponent,
        data: { title: 'Cuentas', description: 'Saldos por cuenta y balance disponible.' },
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'sign-in' },
  { path: '**', redirectTo: 'sign-in' },
];
