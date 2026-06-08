
import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { familyRoleGuard } from './core/guards/family-role.guard';

const adminOrOwnerGuard = familyRoleGuard(['owner', 'admin']);
const ownerGuard = familyRoleGuard(['owner']);

export const routes: Routes = [
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./features/auth/sign-in.component').then((module) => module.SignInComponent),
  },
  {
    path: 'create-family',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/family/create-family.component').then(
        (module) => module.CreateFamilyComponent,
      ),
  },
  {
    path: 'select-family',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/family/select-family.component').then(
        (module) => module.SelectFamilyComponent,
      ),
  },
  {
    path: 'accept-invitation',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/family-members/accept-invitation.component').then(
        (module) => module.AcceptInvitationComponent,
      ),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/app-shell.component').then(
        (module) => module.AppShellComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (module) => module.DashboardComponent,
          ),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transactions-home.component').then(
            (module) => module.TransactionsHomeComponent,
          ),
      },
      ...(['expense', 'income', 'transfer'] as const).map((mode) => ({
        path: `transactions/${mode}`,
        data: { mode },
        loadComponent: () =>
          import('./features/transactions/transaction-form.component').then(
            (module) => module.TransactionFormComponent,
          ),
      })),
      {
        path: 'transactions/:id/edit',
        loadComponent: () =>
          import('./features/transactions/transaction-form.component').then(
            (module) => module.TransactionFormComponent,
          ),
      },
      {
        path: 'budgets',
        loadComponent: () =>
          import('./features/budgets/budgets-list.component').then(
            (module) => module.BudgetsListComponent,
          ),
      },
      {
        path: 'budgets/new',
        canActivate: [adminOrOwnerGuard],
        loadComponent: () =>
          import('./features/budgets/create-budget.component').then(
            (module) => module.CreateBudgetComponent,
          ),
      },
      {
        path: 'budgets/:id/edit',
        canActivate: [adminOrOwnerGuard],
        loadComponent: () =>
          import('./features/budgets/create-budget.component').then(
            (module) => module.CreateBudgetComponent,
          ),
      },
      {
        path: 'budgets/:id/copy',
        canActivate: [adminOrOwnerGuard],
        data: { mode: 'copy' },
        loadComponent: () =>
          import('./features/budgets/create-budget.component').then(
            (module) => module.CreateBudgetComponent,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then(
            (module) => module.ReportsComponent,
          ),
      },
      {
        path: 'more',
        loadComponent: () =>
          import('./features/settings/more.component').then((module) => module.MoreComponent),
      },
      {
        path: 'accounts',
        loadComponent: () =>
          import('./features/accounts/accounts-list.component').then(
            (module) => module.AccountsListComponent,
          ),
      },
      {
        path: 'accounts/new',
        canActivate: [adminOrOwnerGuard],
        loadComponent: () =>
          import('./features/accounts/create-account.component').then(
            (module) => module.CreateAccountComponent,
          ),
      },
      {
        path: 'accounts/:id/edit',
        canActivate: [adminOrOwnerGuard],
        loadComponent: () =>
          import('./features/accounts/create-account.component').then(
            (module) => module.CreateAccountComponent,
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories-list.component').then(
            (module) => module.CategoriesListComponent,
          ),
      },
      {
        path: 'categories/new',
        canActivate: [adminOrOwnerGuard],
        loadComponent: () =>
          import('./features/categories/create-category.component').then(
            (module) => module.CreateCategoryComponent,
          ),
      },
      {
        path: 'categories/:id/edit',
        canActivate: [adminOrOwnerGuard],
        loadComponent: () =>
          import('./features/categories/create-category.component').then(
            (module) => module.CreateCategoryComponent,
          ),
      },
      {
        path: 'recurring-payments',
        loadComponent: () =>
          import('./features/recurring-payments/recurring-payments-list.component').then(
            (module) => module.RecurringPaymentsListComponent,
          ),
      },
      {
        path: 'recurring-payments/new',
        canActivate: [adminOrOwnerGuard],
        loadComponent: () =>
          import('./features/recurring-payments/create-recurring-payment.component').then(
            (module) => module.CreateRecurringPaymentComponent,
          ),
      },
      {
        path: 'recurring-payments/:id/edit',
        canActivate: [adminOrOwnerGuard],
        loadComponent: () =>
          import('./features/recurring-payments/create-recurring-payment.component').then(
            (module) => module.CreateRecurringPaymentComponent,
          ),
      },
      {
        path: 'recurring-payments/:id/pay',
        loadComponent: () =>
          import('./features/recurring-payments/mark-recurring-paid.component').then(
            (module) => module.MarkRecurringPaidComponent,
          ),
      },
      {
        path: 'family-members',
        loadComponent: () =>
          import('./features/family-members/family-members.component').then(
            (module) => module.FamilyMembersComponent,
          ),
      },
      {
        path: 'family-members/invite',
        canActivate: [ownerGuard],
        loadComponent: () =>
          import('./features/family-members/invite-member.component').then(
            (module) => module.InviteMemberComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(
            (module) => module.SettingsComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'sign-in' },
  { path: '**', redirectTo: 'sign-in' },
];
