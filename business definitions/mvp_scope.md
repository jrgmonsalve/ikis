# Personal and Family Finance App - MVP Scope

## MVP Goal

Build a mobile-first PWA that allows individuals and families to manually track income, expenses, account balances, budgets, recurring payments, language preferences, and supported currencies in a simple and fast way.

The MVP should help users answer these questions:

- How much money do I have available?
- Where is my money going?
- What payments are coming soon?
- Am I staying within my budget?
- What is the current financial status of my family?
- Can I use the app in Spanish or English?
- Can I manage values in COP or USD?

---

# Included Features

## 1. Authentication

The MVP includes:

- Sign in with Google.
- User profile creation after first sign in.
- Session management.

The MVP does not include:

- Email and password authentication.
- Multi-factor authentication.
- Password recovery.

---

## 2. Family Management

The MVP includes:

- Create a family.
- Assign the creator as family owner.
- Invite family members by email.
- Accept family invitations.
- Basic member roles.

The MVP does not include:

- Advanced permission management.
- Multiple owner transfer flows.
- Family deletion.

---

## 3. Account Management

The MVP includes:

- Create financial accounts.
- Supported account types:
  - Savings
  - Cash
  - Digital Wallet
  - Credit Card
- Define initial balance.
- View account balances.
- Exclude credit card debt from available balance.

The MVP does not include:

- Bank synchronization.
- Automatic balance updates from banks.
- Account reconciliation.
- Advanced multi-currency account management.

---

## 4. Category Management

The MVP includes:

- Create categories.
- Assign category name.
- Assign optional color.
- Assign optional icon.
- Use categories for income, expenses, reports, and budgets.

The MVP does not include:

- Category hierarchy.
- Default category templates.
- AI category suggestions.

---

## 5. Transaction Management

The MVP includes:

- Register expenses.
- Register income.
- Register transfers between accounts.
- Assign account.
- Assign category.
- Assign transaction date.
- Add optional description.
- Update balances based on transactions.
- Edit active manual transactions and adjust affected account balances.
- Cancel active transactions and roll back affected account balances.

The MVP does not include:

- Attach receipts.
- Split transactions.
- Recurring automatic transactions.
- Import transactions from files or banks.

---

## 6. Budget Management

The MVP includes:

- Create budgets by category.
- Define planned amount.
- Define budget period type:
  - Monthly
  - Yearly
  - Custom date range
- Calculate spent amount.
- Calculate remaining amount.
- Show budget progress.
- Mark exceeded budgets.

The MVP does not include:

- Budget templates.
- Budget rollover.
- Shared budget approval workflows.
- AI budget recommendations.

---

## 7. Recurring Payments

The MVP includes:

- Create recurring payments.
- Define expected amount.
- Define frequency.
- Define next due date.
- Assign optional suggested account.
- Assign optional suggested category.
- View upcoming recurring payments.
- Mark recurring payment as paid.
- Create expense when payment is marked as paid.

The MVP does not include:

- Automatic payment execution.
- External payment reminders by SMS or WhatsApp.
- Payment provider integrations.

---

## 8. Reports and Dashboard

The MVP includes:

- View financial dashboard.
- View total available balance.
- View income for selected period.
- View expenses for selected period.
- View expenses by category.
- View budget progress.
- View upcoming recurring payments.
- Filter dashboard/report data by:
  - Monthly period
  - Yearly period
  - Custom date range

The MVP does not include:

- Advanced analytics.
- Forecasting.
- Export to Excel or PDF.
- AI insights.
- Tax reports.

---

## 9. Language Support

The MVP includes:

- Support for Spanish.
- Support for English.
- The user can select the application language.
- The system can show labels, menus, messages, validations, and main content in the selected language.

The MVP does not include:

- More languages beyond Spanish and English.
- Automatic translation of user-created content.
- Region-specific legal or tax wording.

---

## 10. Currency Support

The MVP includes:

- Support for Colombian Peso.
- Support for US Dollar.
- The user can select the main currency for a family.
- Accounts, transactions, budgets, recurring payments, reports, and dashboard values must use the selected currency.
- Currency formatting should respect the selected currency.

Supported currencies for MVP:

- COP
- USD

The MVP does not include:

- Currency exchange rate conversion.
- Automatic exchange rate updates.
- Multi-currency accounts.
- Reports combining multiple currencies.

---

# Excluded from MVP

The following features are intentionally excluded from the first version:

- Debt management.
- Loan management.
- Receivables.
- Payables.
- Bank integration.
- Advanced multi-currency support.
- Receipt attachments.
- Financial goals.
- AI suggestions.
- Advanced reports.
- Export to Excel or PDF.
- Native mobile app.
- Offline-first sync.
- Notifications through external channels.
- More languages beyond Spanish and English.
- Currency exchange rate conversion.
- Automatic exchange rate updates.

---

# First Release Assumptions

- The application will be a mobile-first PWA.
- Users will register and sign in using Google.
- Transactions will be entered manually.
- A user can create or join a family.
- A family can represent one person, a couple, or a household.
- The system will focus on simplicity and speed.
- The first version will prioritize expense control and budgeting.
- The MVP will support Spanish and English.
- The MVP will support COP and USD.
- Each family will have one main currency.
- Bank integrations may be considered in a future version.

---

# Success Criteria

The MVP is successful if a user can:

- Sign in with Google.
- Create a family.
- Invite another family member.
- Create real financial accounts.
- Create categories.
- Register income.
- Register expenses.
- Register transfers.
- View current account balances.
- Create budgets.
- Track budget progress.
- Create recurring payments.
- Mark recurring payments as paid.
- View a useful financial dashboard.
- Understand where the family money is going.
- Use the application in Spanish or English.
- Manage family finances using COP or USD.
