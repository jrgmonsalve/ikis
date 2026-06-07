# Personal and Family Finance App - Development Backlog and Implementation Plan

## Goal

Release IKIS web aplication

---

# 1. Implementation Strategy

## Recommended Approach

Build the MVP.

You and me are working in this project try to progress with all task if you help to create something in firebase console or github just tell. 

Recommended order:

1. Project setup.
2. Authentication.
3. Family management.
4. Firestore structure.
5. Accounts and categories.
6. Transactions.
7. Budgets.
8. Recurring payments.
9. Dashboard and reports.
10. Security rules and tests.
11. CI/CD and deployment.
12. Final MVP validation.

---

# 2. Phase 1: Project Setup

## Goal

Create the technical foundation of the application.

## Tasks

### FE-001: Create Angular Project

Description:

Create the Angular application that will be used as the PWA frontend.

Acceptance Criteria:

- Angular project is created.
- TypeScript is enabled.
- Application runs locally.
- Basic routing is configured.

---

### FE-002: Add Tailwind CSS

Description:

Configure Tailwind CSS for the Angular project.

Acceptance Criteria:

- Tailwind CSS is installed.
- Tailwind configuration is created.
- Global styles are configured.
- A test component can use Tailwind classes.

---

### FE-003: Configure Angular PWA

Description:

Enable PWA support in the Angular application.

Acceptance Criteria:

- Angular PWA package is configured.
- Manifest file exists.
- Service worker configuration exists.
- App can be installed as PWA in supported browsers.

---

### FE-004: Configure Project Folder Structure

Description:

Create the initial frontend folder structure.

Suggested structure:

    src/app/
      core/
      shared/
      features/

Acceptance Criteria:

- Core folder exists.
- Shared folder exists.
- Features folder exists.
- Initial feature folders are created.

---

### FB-001: Initialize Firebase Project Locally

Description:

Initialize Firebase configuration in the repository.

Acceptance Criteria:

- firebase.json exists.
- .firebaserc exists.
- Firestore rules file exists.
- Firestore indexes file exists.
- Firebase Hosting target is configured.
- Firebase Functions folder is configured if needed.

---

# 3. Phase 2: Authentication

## Goal

Allow users to sign in with Google and create a user profile.

## Tasks

### AUTH-001: Configure Firebase Authentication

Description:

Enable Firebase Authentication and Google provider.

Acceptance Criteria:

- Firebase Authentication is enabled.
- Google provider is enabled.
- Angular app can initialize Firebase Auth.

---

### AUTH-002: Implement Sign In with Google

Description:

Create the sign-in flow using Google authentication.

Acceptance Criteria:

- User can click Sign in with Google.
- Google authentication flow opens.
- User can authenticate successfully.
- App receives authenticated user data.
- Authentication errors are handled.

Related User Story:

- US-001: Sign in with Google

Related User Flow:

- UF-001: Sign in with Google

---

### AUTH-003: Create User Profile on First Login

Description:

Create a Firestore user profile when the user signs in for the first time.

Acceptance Criteria:

- The system checks if users/{userId} exists.
- If it does not exist, the system creates it.
- If it exists, the system updates lastLoginAt.
- User profile stores preferredLanguage.

---

### AUTH-004: Implement Auth Guard

Description:

Protect private routes from unauthenticated access.

Acceptance Criteria:

- Unauthenticated users cannot access private routes.
- Authenticated users can access private routes.
- Unauthenticated users are redirected to Welcome / Sign In.

---

# 4. Phase 3: Family Management

## Goal

Allow users to create and select family workspaces.

## Tasks

### FAM-001: Create Family Model and Service

Description:

Create frontend models and service methods for family data.

Acceptance Criteria:

- Family TypeScript interface exists.
- Family service can create a family.
- Family service can read family data.

---

### FAM-002: Implement Create Family Screen

Description:

Create the screen for creating a family.

Acceptance Criteria:

- User can enter family name.
- User can select main currency: COP or USD.
- Form validates required fields.
- On submit, family is created.
- Creator becomes owner.

Related User Story:

- US-002: Create a Family

Related User Flow:

- UF-002: Create a Family

---

### FAM-003: Implement Family Creation Write Logic

Description:

Create the family document and owner member document together.

Acceptance Criteria:

- families/{familyId} is created.
- families/{familyId}/members/{userId} is created.
- Owner role is assigned.
- User is redirected to dashboard after creation.

Recommended Implementation:

- Batch write or Cloud Function.

---

### FAM-004: Implement Select Family Screen

Description:

Allow users with multiple families to select the active family.

Acceptance Criteria:

- User can see families where they are active members.
- User can select a family.
- Selected family is stored in app state.
- User is redirected to selected family dashboard.

---

### FAM-005: Implement Selected Family Context

Description:

Create a frontend service to manage the currently selected family.

Acceptance Criteria:

- App can store selected family.
- App can retrieve selected family.
- App can change selected family.
- Feature screens use selected family context.

---

# 5. Phase 4: Family Members and Invitations

## Goal

Allow the family owner to invite members.

## Tasks

### MEM-001: Create Family Member Model and Service

Description:

Create models and service methods for family members.

Acceptance Criteria:

- FamilyMember interface exists.
- Service can list members.
- Service can read current user role.

---

### MEM-002: Implement Family Members Screen

Description:

Show active family members and pending invitations.

Acceptance Criteria:

- Owner can see family members.
- Member name, email, and role are displayed.
- Pending invitations are displayed if available.

---

### INV-001: Create Invitation Model and Service

Description:

Create models and service methods for invitations.

Acceptance Criteria:

- Invitation interface exists.
- Service can create invitation.
- Service can list invitations.

---

### INV-002: Implement Invite Family Member Screen

Description:

Allow owner to invite another user by email.

Acceptance Criteria:

- Owner can enter email.
- Owner can select role.
- System validates email.
- System prevents duplicate pending invitations.
- Invitation is created as pending.

Related User Story:

- US-003: Invite a Family Member

Related User Flow:

- UF-003: Invite a Family Member

---

### INV-003: Implement Accept Invitation Flow

Description:

Allow an invited user to accept an invitation.

Acceptance Criteria:

- Invited user can open invitation link.
- User must sign in with Google.
- System validates invitation.
- System creates family member document.
- Invitation status becomes accepted.
- User is redirected to family dashboard.

Recommended Implementation:

- Cloud Function.

---

# 6. Phase 5: Accounts

## Goal

Allow owners and admins to create accounts and allow members to view balances.

## Tasks

### ACC-001: Create Account Model and Service

Description:

Create TypeScript model and Firestore service for accounts.

Acceptance Criteria:

- Account interface exists.
- Service can list active accounts.
- Service can create account.
- Service can update account if allowed.

---

### ACC-002: Implement Accounts List Screen

Description:

Show family accounts and current balances.

Acceptance Criteria:

- User can see active accounts.
- Account name is shown.
- Account type is shown.
- Current balance is shown.
- Credit card owed balance is shown separately.
- Total available balance excludes credit card debt.

Related User Story:

- US-012: View Account Balances

---

### ACC-003: Implement Create Account Screen

Description:

Allow owner/admin to create a financial account.

Acceptance Criteria:

- User can enter account name.
- User can select account type:
  - Savings
  - Cash
  - Digital Wallet
  - Credit Card
- User can enter initial balance.
- Form validates required fields.
- Account is created inside selected family.

Related User Story:

- US-004: Create an Account

Related User Flow:

- UF-004: Create an Account

---

# 7. Phase 6: Categories

## Goal

Allow owners and admins to create categories, and all members to use them.

## Tasks

### CAT-001: Create Category Model and Service

Description:

Create TypeScript model and Firestore service for categories.

Acceptance Criteria:

- Category interface exists.
- Service can list active categories.
- Service can create category.
- Service validates duplicate names.

---

### CAT-002: Implement Categories List Screen

Description:

Show active categories for the selected family.

Acceptance Criteria:

- User can see category name.
- User can see category color.
- User can see category icon.
- Empty state appears if no categories exist.

---

### CAT-003: Implement Create Category Screen

Description:

Allow owner/admin to create a category.

Acceptance Criteria:

- User can enter category name.
- User can select color.
- User can select icon.
- System validates duplicate active category names.
- Category is created inside selected family.

Related User Story:

- US-005: Create a Category

Related User Flow:

- UF-005: Create a Category

---

# 8. Phase 7: Transactions

## Goal

Allow users to register expenses, income, and transfers.

## Tasks

### TX-001: Create Transaction Model and Service

Description:

Create TypeScript model and transaction service.

Acceptance Criteria:

- Transaction interface exists.
- Service supports expense creation.
- Service supports income creation.
- Service supports transfer creation.
- Service calls Cloud Functions or Firestore transactions for critical writes.

---

### TX-002: Implement Add Expense Screen

Description:

Allow users to register an expense quickly.

Acceptance Criteria:

- User can enter amount.
- User can select account.
- User can select category.
- User can enter optional description.
- User can select transaction date.
- If no date is selected, current date is used.
- Expense is created.
- Account balance is reduced.

Related User Story:

- US-006: Register an Expense

Related User Flow:

- UF-006: Register an Expense

---

### TX-003: Implement Add Income Screen

Description:

Allow users to register income.

Acceptance Criteria:

- User can enter amount.
- User can select account.
- User can select category.
- User can enter optional description.
- User can select transaction date.
- If no date is selected, current date is used.
- Income is created.
- Account balance is increased.

Related User Story:

- US-007: Register an Income

Related User Flow:

- UF-007: Register an Income

---

### TX-004: Implement Add Transfer Screen

Description:

Allow users to register transfers between accounts.

Acceptance Criteria:

- User can enter amount.
- User can select source account.
- User can select destination account.
- Source and destination accounts must be different.
- User can enter optional description.
- User can select transaction date.
- Transfer is created.
- Source account balance is reduced.
- Destination account balance is increased.
- Transfer does not affect income, expense, or budget reports.

Related User Story:

- US-008: Register a Transfer

Related User Flow:

- UF-008: Register a Transfer

---

### CF-001: Implement createExpense Cloud Function

Description:

Create a Cloud Function for creating expense transactions.

Acceptance Criteria:

- Validates authentication.
- Validates family membership.
- Validates amount, account, category, and date.
- Creates transaction document.
- Updates account balance atomically.
- Returns success or error response.

---

### CF-002: Implement createIncome Cloud Function

Description:

Create a Cloud Function for creating income transactions.

Acceptance Criteria:

- Validates authentication.
- Validates family membership.
- Validates amount, account, category, and date.
- Creates transaction document.
- Updates account balance atomically.
- Returns success or error response.

---

### CF-003: Implement createTransfer Cloud Function

Description:

Create a Cloud Function for creating transfers.

Acceptance Criteria:

- Validates authentication.
- Validates family membership.
- Validates source and destination accounts.
- Validates source and destination are different.
- Creates transfer transaction.
- Updates both account balances atomically.
- Returns success or error response.

---

# 9. Phase 8: Budgets

## Goal

Allow owners and admins to create budgets and all members to view budget progress.

## Tasks

### BUD-001: Create Budget Model and Service

Description:

Create TypeScript model and Firestore service for budgets.

Acceptance Criteria:

- Budget interface exists.
- Service can list active budgets.
- Service can create budget.
- Service can calculate or read budget progress.

---

### BUD-002: Implement Budgets List Screen

Description:

Show active budgets and progress.

Acceptance Criteria:

- User can view budget name.
- User can view category.
- User can view planned amount.
- User can view spent amount.
- User can view remaining amount.
- User can view percentage used.
- Exceeded budgets are clearly marked.

Related User Story:

- US-014: View Budget Progress

Related User Flow:

- UF-014: View Budget Progress

---

### BUD-003: Implement Create Budget Screen

Description:

Allow owner/admin to create a budget.

Acceptance Criteria:

- User can enter budget name.
- User can select category.
- User can enter planned amount.
- User can select period type:
  - Monthly
  - Yearly
  - Custom date range
- Required date fields appear based on selected period type.
- System validates duplicate budget for same category and period.
- Budget is created.
- Owner or admin can copy a completed budget to a new period.
- Copy preserves name, category, planned amount, currency, and period type.
- Monthly and yearly copies default to the following period.
- Custom copies require new dates.
- Copied budget is created as a new record with independently calculated progress.
- Duplicate category-and-period validation applies to copied budgets.

Related User Story:

- US-009: Create a Budget

Related User Flow:

- UF-009: Create a Budget

---

# 10. Phase 9: Recurring Payments

## Goal

Allow users to track and pay recurring financial obligations.

## Tasks

### RP-001: Create Recurring Payment Model and Service

Description:

Create TypeScript model and Firestore service for recurring payments.

Acceptance Criteria:

- RecurringPayment interface exists.
- Service can list active recurring payments.
- Service can create recurring payment.
- Service can mark payment as paid through Cloud Function.

---

### RP-002: Implement Recurring Payments List Screen

Description:

Show upcoming recurring payments.

Acceptance Criteria:

- User can view payment name.
- User can view expected amount.
- User can view frequency.
- User can view next due date.
- User can view suggested account and category.
- Payments are ordered by next due date.
- User can mark payment as paid.

Related User Story:

- US-015: View Upcoming Recurring Payments

Related User Flow:

- UF-015: View Upcoming Recurring Payments

---

### RP-003: Implement Create Recurring Payment Screen

Description:

Allow owner/admin to create a recurring payment.

Acceptance Criteria:

- User can enter payment name.
- User can enter expected amount.
- User can select frequency.
- User can select next due date.
- User can optionally select suggested account.
- User can optionally select suggested category.
- Recurring payment is created as active.

Related User Story:

- US-010: Create a Recurring Payment

Related User Flow:

- UF-010: Create a Recurring Payment

---

### RP-004: Implement Mark Recurring Payment as Paid Screen

Description:

Allow a user to confirm a recurring payment and create the related expense.

Acceptance Criteria:

- User can confirm or edit payment amount.
- User can confirm or select account.
- User can confirm or select category.
- User can select payment date.
- System creates expense.
- Account balance is updated.
- Recurring payment lastPaidAt is updated.
- Recurring payment nextDueDate is updated.

Related User Story:

- US-011: Mark a Recurring Payment as Paid

Related User Flow:

- UF-011: Mark a Recurring Payment as Paid

---

### CF-004: Implement markRecurringPaymentAsPaid Cloud Function

Description:

Create a Cloud Function to mark recurring payments as paid.

Acceptance Criteria:

- Validates authentication.
- Validates family membership.
- Validates recurring payment.
- Creates expense transaction.
- Updates account balance.
- Updates lastPaidAt.
- Calculates and updates nextDueDate.
- Returns success or error response.

---

# 11. Phase 10: Reports and Dashboard

## Goal

Allow users to understand the family’s financial status.

## Tasks

### DASH-001: Create Dashboard Service

Description:

Create service to load dashboard data.

Acceptance Criteria:

- Service loads active accounts.
- Service loads transactions for selected period.
- Service loads active budgets.
- Service loads upcoming recurring payments.
- Service calculates dashboard summary.

---

### DASH-002: Implement Family Dashboard Screen

Description:

Show financial summary for selected family.

Acceptance Criteria:

- Shows total available balance.
- Shows income for selected period.
- Shows expenses for selected period.
- Shows budget progress summary.
- Shows upcoming recurring payments.
- Shows expenses by category summary.
- User can change period.

Related User Story:

- US-016: View Financial Dashboard

Related User Flow:

- UF-016: View Financial Dashboard

---

### REP-001: Create Reports Service

Description:

Create service for report calculations.

Acceptance Criteria:

- Service can load transactions by period.
- Service can calculate expenses by category.
- Service can calculate income summary.
- Service can calculate expense summary.
- Service can calculate budget usage summary.

---

### REP-002: Implement Reports Screen

Description:

Show financial reports.

Acceptance Criteria:

- User can filter by monthly, yearly, or custom date range.
- User can see expenses by category.
- User can see income summary.
- User can see expense summary.
- User can see budget usage summary.

Related User Story:

- US-013: View Expenses by Category

---

# 12. Phase 11: Settings, Language, and Currency

## Goal

Allow users to configure language and view family currency settings.

## Tasks

### SET-001: Implement Settings Screen

Description:

Create settings screen.

Acceptance Criteria:

- User can see profile information.
- User can change preferred language.
- User can see family main currency.
- Owner can update family name.
- User can sign out.

---

### I18N-001: Configure Internationalization

Description:

Configure English and Spanish support.

Acceptance Criteria:

- English translations exist.
- Spanish translations exist.
- User can change language.
- Main labels, menus, buttons, validations, empty states, and errors are translated.

---

### CUR-001: Implement Currency Formatting

Description:

Create currency formatting support for COP and USD.

Acceptance Criteria:

- COP values are formatted correctly.
- USD values are formatted correctly.
- Family main currency is used in accounts, transactions, budgets, recurring payments, dashboard, and reports.

---

# 13. Phase 12: Security Rules and Indexes

## Goal

Secure Firestore and support required queries.

## Tasks

### SEC-001: Add Firestore Security Rules

Description:

Add the approved Firestore security rules draft.

Acceptance Criteria:

- firestore.rules exists.
- Rules are deployed to Firebase.
- Unauthenticated users are denied.
- Cross-family access is denied.
- Role permissions are enforced.

---

### SEC-002: Add Firestore Security Rules Tests

Description:

Use Firebase Emulator Suite to test security rules.

Acceptance Criteria:

- Tests cover unauthenticated access.
- Tests cover owner access.
- Tests cover admin access.
- Tests cover member access.
- Tests cover cross-family denial.
- Tests cover invalid writes.

---

### IDX-001: Configure Firestore Indexes

Description:

Create required indexes for MVP queries.

Acceptance Criteria:

- firestore.indexes.json exists.
- Required transaction indexes are configured.
- Required budget indexes are configured.
- Required recurring payment indexes are configured.
- Required invitation indexes are configured.
- Indexes are deployed.

---

# 14. Phase 13: CI/CD and Deployment

## Goal

Automate validation and deployment.

## Tasks

### CICD-001: Create Pull Request Workflow

Description:

Create GitHub Actions workflow for pull requests.

Acceptance Criteria:

- Workflow runs on pull requests.
- Installs dependencies.
- Runs lint.
- Runs tests.
- Builds Angular app.
- Builds Cloud Functions.

---

### CICD-002: Create Production Deployment Workflow

Description:

Create GitHub Actions workflow for deployment to Firebase.

Acceptance Criteria:

- Workflow runs on main branch.
- Builds Angular app.
- Builds Cloud Functions.
- Deploys Firebase Hosting.
- Deploys Firestore rules.
- Deploys Firestore indexes.
- Deploys Cloud Functions.

---

### DEP-001: Deploy MVP to Firebase Hosting

Description:

Deploy the first working version of the app.

Acceptance Criteria:

- App is deployed to Firebase Hosting.
- App can be opened from public URL.
- Google sign-in works.
- Authenticated routes work.
- Firestore access works based on rules.

---

# 15. Phase 14: MVP Validation

## Goal

Validate the MVP end-to-end.

## Tasks

### QA-001: Validate First User Onboarding

Acceptance Criteria:

- User can sign in.
- User can create family.
- User becomes owner.
- User is redirected to dashboard.

---

### QA-002: Validate Account and Category Setup

Acceptance Criteria:

- Owner/admin can create account.
- Owner/admin can create category.
- Member cannot create account or category if restricted by role.

---

### QA-003: Validate Transactions

Acceptance Criteria:

- User can register expense.
- User can register income.
- User can register transfer.
- Account balances update correctly.
- Transfers do not affect income or expense reports.

---

### QA-004: Validate Budgets

Acceptance Criteria:

- Owner/admin can create budget.
- Budget usage is calculated from expenses.
- Income and transfers do not affect budget usage.
- Exceeded budget is marked.

---

### QA-005: Validate Recurring Payments

Acceptance Criteria:

- Owner/admin can create recurring payment.
- User can see upcoming recurring payment.
- User can mark payment as paid.
- Expense is created.
- Account balance is updated.
- Next due date is updated.

---

### QA-006: Validate Dashboard and Reports

Acceptance Criteria:

- Dashboard shows available balance.
- Dashboard shows income and expenses.
- Dashboard shows budget summary.
- Dashboard shows recurring payments.
- Reports show expenses by category.

---

### QA-007: Validate Language and Currency

Acceptance Criteria:

- User can switch between English and Spanish.
- COP formatting works.
- USD formatting works.
- Family currency is applied consistently.

---

### QA-008: Validate Security

Acceptance Criteria:

- Unauthenticated users cannot access private data.
- Users cannot access other families.
- Members cannot perform admin-only actions.
- Owner permissions work correctly.

---

# 16. Recommended MVP Build Order

The recommended development order is:

1. Project setup.
2. Firebase setup.
3. Authentication.
4. Family creation and selection.
5. Accounts.
6. Categories.
7. Transactions.
8. Budgets.
9. Recurring payments.
10. Dashboard.
11. Reports.
12. Settings, language, and currency.
13. Security rules tests.
14. CI/CD.
15. Final MVP validation.

---

# 17. MVP Definition of Done

The MVP is done when:

- A user can sign in with Google.
- A user can create a family.
- A user can invite another family member.
- The family can create accounts and categories.
- Family members can register expenses, income, and transfers.
- Account balances are updated correctly.
- Budgets can be created and tracked.
- Recurring payments can be created and marked as paid.
- Dashboard provides useful financial summary.
- Reports show expenses by category.
- English and Spanish are supported.
- COP and USD are supported.
- Firestore security rules protect family data.
- The app is deployed as a PWA using Firebase Hosting.
- CI/CD pipeline can deploy the application.
