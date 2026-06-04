# Personal and Family Finance App - Technical Architecture

## Goal

Define the technical architecture for the MVP of the Personal and Family Finance App.

The architecture is focused on:

- Mobile-first PWA experience.
- Simple authentication with Google.
- Family-based financial data isolation.
- Cloud Firestore as the main database.
- Firebase Cloud Functions for critical financial operations.
- Firebase Hosting for deployment.
- GitHub Actions for CI/CD.

---

# 1. Proposed Technology Stack

## Frontend

- Angular
- TypeScript
- Tailwind CSS
- Angular PWA
- Firebase JavaScript SDK

## Authentication

- Firebase Authentication
- Google Sign-In provider

## Database

- Cloud Firestore

## Backend Logic

- Firebase Cloud Functions

## Hosting

- Firebase Hosting

## CI/CD

- GitHub Actions

## Repository

Recommended approach:

- Single repository for frontend, Firebase Functions, Firestore rules, indexes, and documentation.

---

# 2. High-Level Architecture

## Main Components

The MVP architecture includes:

- Angular PWA.
- Firebase Authentication.
- Cloud Firestore.
- Firebase Cloud Functions.
- Firebase Hosting.
- GitHub Actions.

## Application Flow

1. The user opens the PWA.
2. Firebase Hosting serves the Angular application.
3. The user signs in with Google using Firebase Authentication.
4. The Angular app reads and writes data from Cloud Firestore.
5. Critical financial operations are handled through Cloud Functions.
6. Firestore Security Rules protect family financial data.
7. GitHub Actions deploys the application and Firebase configuration.

---

# 3. Frontend Architecture

## Framework

Use Angular as the frontend framework.

## Responsibilities

The Angular app is responsible for:

- Rendering the mobile-first user interface.
- Managing routes and navigation.
- Handling Google sign-in through Firebase Authentication.
- Calling Firestore for allowed read operations.
- Calling Cloud Functions for critical financial writes.
- Managing local UI state.
- Supporting English and Spanish.
- Formatting COP and USD values.

## Suggested Angular Areas

The frontend can be organized by feature:

- auth
- family
- dashboard
- accounts
- categories
- transactions
- budgets
- recurring-payments
- reports
- settings
- shared

## Suggested Frontend Principles

- Keep components focused on UI.
- Move Firestore and Cloud Function calls to services.
- Use typed interfaces for domain models.
- Use route guards for authenticated routes.
- Use a selected family context service.
- Use reusable UI components for forms, cards, lists, selectors, and empty states.

---

# 4. Authentication Architecture

## Provider

Use Firebase Authentication with Google provider.

## Authentication Flow

1. User opens the application.
2. User selects Sign in with Google.
3. Firebase Authentication handles Google sign-in.
4. The app receives the authenticated user.
5. The app checks if the user profile exists in Firestore.
6. If the profile does not exist, the app creates it.
7. The app checks the user family memberships.
8. The app redirects the user based on family status.

## Routing Rules After Sign In

- If the user has no family, redirect to Create Family.
- If the user belongs to one family, redirect to Family Dashboard.
- If the user belongs to multiple families, redirect to Select Family.

## Protected Routes

The following routes require authentication:

- Dashboard.
- Families.
- Accounts.
- Categories.
- Transactions.
- Budgets.
- Recurring payments.
- Reports.
- Settings.

---

# 5. Firestore Architecture

## Main Structure

Recommended Firestore structure:

    users/{userId}

    families/{familyId}
      members/{userId}
      invitations/{invitationId}
      accounts/{accountId}
      categories/{categoryId}
      transactions/{transactionId}
      budgets/{budgetId}
      recurringPayments/{recurringPaymentId}
      dashboardSnapshots/{snapshotId}

## Design Principles

- Financial data belongs to a family.
- Users access data only through active family membership.
- Subcollections keep data naturally scoped to families.
- Account balances are stored for fast reads.
- Transactions remain the historical source of financial activity.
- Important entities are deactivated instead of deleted.

## Firestore Reads

The Angular app can directly read:

- User profile.
- Family document.
- Family members.
- Accounts.
- Categories.
- Transactions.
- Budgets.
- Recurring payments.
- Dashboard snapshots if implemented.

All reads must be protected by Firestore Security Rules.

---

# 6. Cloud Functions Architecture

## Purpose

Cloud Functions should handle operations that affect multiple documents or require stronger consistency.

## Recommended Cloud Functions for MVP

### createExpense

Responsibilities:

- Validate authenticated user.
- Validate family membership.
- Validate transaction input.
- Create expense transaction.
- Update account balance.
- Optionally update budget cached values.

### createIncome

Responsibilities:

- Validate authenticated user.
- Validate family membership.
- Validate transaction input.
- Create income transaction.
- Update account balance.

### createTransfer

Responsibilities:

- Validate authenticated user.
- Validate family membership.
- Validate source and destination accounts.
- Create transfer transaction.
- Decrease source account balance.
- Increase destination account balance.

### markRecurringPaymentAsPaid

Responsibilities:

- Validate authenticated user.
- Validate family membership.
- Validate recurring payment.
- Create expense transaction.
- Update account balance.
- Update recurring payment lastPaidAt.
- Calculate and update nextDueDate.

### cancelTransaction

Responsibilities:

- Validate authenticated user.
- Validate role.
- Mark transaction as cancelled.
- Reverse account balance impact.
- Update related budget cached values if used.

## Why Use Cloud Functions

Cloud Functions are recommended because financial operations often require multiple writes.

Example:

- Create transaction.
- Update account balance.
- Update recurring payment.
- Update dashboard snapshot.

These operations must remain consistent.

---

# 7. Firestore Security Rules

## Purpose

Firestore Security Rules protect data from unauthorized access.

## Security Strategy

Rules should enforce:

- Authentication required.
- Family membership required.
- Role-based permissions.
- Family data isolation.
- Allowed values.
- Positive amounts.
- Document familyId consistency.
- CreatedByUserId consistency.

## Important Note

Security rules should not be the only place for business logic.

Use Cloud Functions or Firestore transactions for financial consistency.

---

# 8. Internationalization

## Supported Languages

The MVP supports:

- English
- Spanish

## Recommended Frontend Approach

Use Angular i18n or a translation library such as Transloco or ngx-translate.

## Translatable Content

The application should translate:

- Labels.
- Menus.
- Buttons.
- Validation messages.
- Empty states.
- Error messages.
- Dashboard labels.
- Report labels.

## Not Automatically Translated

The system should not automatically translate user-created content such as:

- Category names.
- Account names.
- Transaction descriptions.
- Family names.
- Budget names.

---

# 9. Currency Support

## Supported Currencies

The MVP supports:

- COP
- USD

## Currency Rule

Each family has one main currency.

## Currency Behavior

The selected family currency applies to:

- Accounts.
- Transactions.
- Budgets.
- Recurring payments.
- Reports.
- Dashboard.

## Formatting

The frontend should format values according to the selected currency.

Examples:

- COP: $120.000
- USD: $120.00

## Excluded from MVP

The MVP does not include:

- Exchange rate conversion.
- Automatic exchange rate updates.
- Multi-currency accounts.
- Reports combining multiple currencies.

---

# 10. Hosting Architecture

## Hosting Service

Use Firebase Hosting.

## Responsibilities

Firebase Hosting serves:

- Angular production build.
- Static assets.
- PWA files.
- Service worker files.

## Deployment Output

Angular build output should be deployed to Firebase Hosting.

Common output folder:

    dist/{app-name}/browser

The exact path depends on the Angular version and project configuration.

---

# 11. CI/CD Architecture

## Tool

Use GitHub Actions.

## Recommended Pipelines

### Pull Request Pipeline

Run on pull requests.

Steps:

- Install dependencies.
- Run lint.
- Run tests.
- Build Angular app.
- Build Firebase Functions.
- Validate Firestore rules if tests exist.

### Main Branch Deployment Pipeline

Run on merge to main.

Steps:

- Install dependencies.
- Run tests.
- Build Angular app.
- Build Firebase Functions.
- Deploy Firebase Hosting.
- Deploy Firestore rules.
- Deploy Firestore indexes.
- Deploy Cloud Functions.

## Secrets Required

GitHub Actions will need deployment credentials.

Recommended options:

- Firebase service account stored as GitHub secret.
- Workload Identity Federation if using a more advanced Google Cloud setup.

For MVP, a Firebase service account secret is usually simpler.

---

# 12. Environment Configuration

## Recommended Environments

Use at least:

- Development
- Production

Optional later:

- Staging

## Environment Variables

Frontend needs Firebase web configuration:

- apiKey
- authDomain
- projectId
- storageBucket
- messagingSenderId
- appId

Cloud Functions may need:

- projectId
- environment name
- allowed origins if HTTP callable functions are used

## Recommended Files

Angular environment files:

- environment.ts
- environment.development.ts
- environment.production.ts

Firebase files:

- firebase.json
- .firebaserc
- firestore.rules
- firestore.indexes.json

---

# 13. Suggested Repository Structure

Recommended single-repository structure:

    personal-family-finance-app/
      apps/
        web/
          src/
            app/
              core/
              shared/
              features/
                auth/
                family/
                dashboard/
                accounts/
                categories/
                transactions/
                budgets/
                recurring-payments/
                reports/
                settings/
            environments/
      functions/
        src/
          index.ts
          transactions/
          recurring-payments/
          shared/
      firebase/
        firestore.rules
        firestore.indexes.json
      docs/
        product/
        architecture/
      .github/
        workflows/
      firebase.json
      .firebaserc
      package.json
      README.md

## Notes

The exact structure can be adjusted depending on whether the project uses:

- Angular CLI only.
- Nx monorepo.
- npm workspaces.
- pnpm workspaces.

For MVP, Angular CLI plus a functions folder is enough.

---

# 14. Recommended Angular Feature Structure

Inside the Angular app:

    src/app/
      core/
        auth/
        guards/
        firebase/
        family-context/
      shared/
        components/
        pipes/
        utils/
        models/
      features/
        auth/
        dashboard/
        accounts/
        categories/
        transactions/
        budgets/
        recurring-payments/
        reports/
        family-members/
        settings/

## Core Module / Core Area

Use for:

- Auth services.
- Route guards.
- Firebase initialization.
- Current user state.
- Selected family context.
- Global error handling.

## Shared Area

Use for:

- Reusable UI components.
- Pipes.
- Models.
- Utility functions.

## Features Area

Use for domain-specific pages and components.

---

# 15. Recommended Service Layer

## Frontend Services

Recommended Angular services:

- AuthService
- UserProfileService
- FamilyService
- FamilyMemberService
- AccountService
- CategoryService
- TransactionService
- BudgetService
- RecurringPaymentService
- ReportService
- DashboardService
- SettingsService
- CurrencyFormatterService
- LanguageService

## Purpose

Services should isolate:

- Firestore reads.
- Cloud Function calls.
- Mapping Firestore documents to TypeScript models.
- UI-facing query methods.

---

# 16. Critical Operations Strategy

## Direct Firestore Writes Allowed

Direct writes can be allowed for simple operations:

- Create category.
- Update category.
- Create budget.
- Create recurring payment.
- Update user preferred language.

## Cloud Function Recommended

Use Cloud Functions for:

- Register expense.
- Register income.
- Register transfer.
- Mark recurring payment as paid.
- Cancel transaction.
- Accept invitation if it creates multiple documents.
- Create family if it creates both family and owner member.

## Reason

These operations affect multiple documents and should be consistent.

---

# 17. Testing Strategy

## Frontend Tests

Recommended:

- Unit tests for services.
- Unit tests for pipes and utility functions.
- Basic component tests for critical forms.

## Cloud Functions Tests

Test:

- createExpense.
- createIncome.
- createTransfer.
- markRecurringPaymentAsPaid.
- cancelTransaction.

## Security Rules Tests

Use Firebase Emulator Suite to test:

- Unauthenticated access denied.
- Cross-family access denied.
- Owner permissions.
- Admin permissions.
- Member permissions.
- Invalid writes denied.
- Valid writes allowed.

---

# 18. Deployment Strategy

## Development

Developer runs:

- Angular app locally.
- Firebase Emulator Suite locally.
- Cloud Functions locally when needed.

## Production

GitHub Actions deploys:

- Firebase Hosting.
- Cloud Functions.
- Firestore rules.
- Firestore indexes.

## Deployment Flow

1. Developer pushes changes.
2. Pull request pipeline validates build and tests.
3. Merge to main.
4. Main pipeline deploys to Firebase.

---

# 19. Architecture Decisions Summary

## Decision 1

Use Angular + Tailwind CSS for the frontend.

## Decision 2

Use Firebase Authentication with Google Sign-In.

## Decision 3

Use Cloud Firestore as the main database.

## Decision 4

Use a family-centered Firestore structure.

## Decision 5

Use Firebase Cloud Functions for critical financial operations.

## Decision 6

Use Firebase Hosting for the PWA.

## Decision 7

Use GitHub Actions for CI/CD.

## Decision 8

Use English and Spanish for MVP language support.

## Decision 9

Use COP and USD as MVP supported currencies.

## Decision 10

Use one main currency per family in the MVP.

---

# 20. Recommended Next Step

After this document, the next step is:

## Firebase Setup Checklist

This checklist should define:

- Firebase project creation.
- Authentication setup.
- Google provider setup.
- Firestore setup.
- Hosting setup.
- Cloud Functions setup.
- GitHub Actions secrets.
- Local emulator setup.
- Environment files.
