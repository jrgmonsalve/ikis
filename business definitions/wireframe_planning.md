# Personal and Family Finance App - Wireframe Planning

## Goal

Define the low-fidelity structure of each MVP screen before creating visual wireframes in Figma.

Each screen includes:

- Purpose
- Related flow
- Header
- Main content
- Main actions
- Empty states
- Validation and error messages
- Mobile behavior

---

# WF-001: Welcome / Sign In

## Related Screen

Welcome / Sign In

## Related Flow

UF-001: Sign in with Google

## Purpose

Allow the user to enter the application using Google authentication.

## Header

The screen should show:

- App name or logo.
- Short product message.

Suggested message:

    Manage your personal and family finances in one place.

## Main Content

The screen should include:

- Sign in with Google button.
- Language selector:
  - English
  - Spanish

## Main Actions

- Sign in with Google.
- Change application language.

## Empty State

Not required.

## Validation and Error Messages

Possible messages:

- Authentication was cancelled.
- Authentication failed. Please try again.
- Unable to start Google sign-in. Please try again.

## Mobile Behavior

- The screen should be simple and centered.
- The Google sign-in button should be easy to tap.
- The language selector should be visible but secondary.

---

# WF-002: Create Family

## Related Screen

Create Family

## Related Flow

UF-002: Create a Family

## Purpose

Allow a new authenticated user to create their first family workspace.

## Header

The screen should show:

- Title: Create your family.
- Short explanation.

Suggested message:

    Create a financial space for yourself or your household.

## Main Content

The screen should include:

- Family name field.
- Main currency selector:
  - COP
  - USD
- Create family button.
- Loading state while the family is being created.

## Main Actions

- Create family.

## Empty State

Not required.

## Validation and Error Messages

Possible messages:

- Family name is required.
- Main currency is required.
- Unable to create family. Please try again.
- Repeated submissions must not create duplicate families for the same user and normalized name.

## Mobile Behavior

- Form should be short.
- Family name should be the first input.
- Currency selector should be simple and visible.
- Create button should be fixed or easy to access near the bottom.

---

# WF-003: Select Family

## Related Screen

Select Family

## Related Flow

UF-001: Sign in with Google

## Purpose

Allow a user who belongs to multiple families to select the active family.

## Header

The screen should show:

- Title: Select family.
- Short explanation.

Suggested message:

    Choose the family workspace you want to manage.

## Main Content

The screen should include:

- List of families.
- Family name.
- User role in each family.
- Main currency.
- Button or tap action to enter a family.
- Option to create another family.

## Main Actions

- Select family.
- Create another family.

## Empty State

If the user has no families:

- Show a message explaining that no family exists.
- Show a button to create a family.

## Validation and Error Messages

Possible messages:

- Unable to load families.
- Unable to select family. Please try again.

## Mobile Behavior

- Each family should be shown as a tappable card.
- Cards should have enough spacing for mobile tapping.
- The selected family should be visually clear.

---

# WF-004: Family Dashboard

## Related Screen

Family Dashboard

## Related Flow

UF-016: View Financial Dashboard

## Purpose

Show the family’s main financial summary.

## Header

The screen should show:

- Selected family name.
- Option to change family if the user belongs to multiple families.
- Current dashboard period.

## Main Content

The screen should include:

- Total available balance card.
- Total income for selected period.
- Total expenses for selected period.
- Budget progress summary.
- Upcoming recurring payments summary.
- Expenses by category summary.
- Period filter:
  - Monthly
  - Yearly
  - Custom date range

## Main Actions

- Add expense.
- Add income.
- Add transfer.
- Change period.
- Open reports.
- Open budgets.
- Open accounts.
- Open recurring payments.

## Empty State

If no accounts exist:

- Show onboarding message.
- Suggest creating the first account.

If no transactions exist:

- Show dashboard with zero values.
- Suggest registering the first transaction.

## Validation and Error Messages

Possible messages:

- Unable to load dashboard data.
- Unable to calculate balances.
- Unable to load budget summary.

## Mobile Behavior

- Use summary cards.
- Keep the most important metric at the top: total available balance.
- Quick actions should be easy to reach.
- The period filter should be compact.

---

# WF-005: Accounts List

## Related Screen

Accounts List

## Related Flow

UF-012: View Account Balances

## Purpose

Show all family accounts and their current balances.

## Header

The screen should show:

- Title: Accounts.
- Total available balance.

## Main Content

The screen should include:

- List of accounts.
- Account name.
- Account type.
- Current balance.
- Credit card owed balance shown separately.
- Create account button.

## Main Actions

- Create account.
- View account details if supported later.

## Empty State

If no accounts exist:

- Show message: No accounts yet.
- Show button: Create your first account.

## Validation and Error Messages

Possible messages:

- Unable to load accounts.
- Unable to calculate account balances.

## Mobile Behavior

- Accounts should be displayed as cards.
- Available money accounts and credit card accounts should be visually separated.
- The create account action should be visible.

---

# WF-006: Create Account

## Related Screen

Create Account

## Related Flow

UF-004: Create an Account

## Purpose

Allow a family member to create a real financial account.

## Header

The screen should show:

- Title: Create account.

## Main Content

The screen should include:

- Account name field.
- Account type selector:
  - Savings
  - Cash
  - Digital Wallet
  - Credit Card
- Initial balance field.
- Save button.

## Main Actions

- Save account.
- Cancel and return to Accounts List.

## Empty State

Not required.

## Validation and Error Messages

Possible messages:

- Account name is required.
- Account type is required.
- Initial balance must be a valid number.
- Unable to create account. Please try again.

## Mobile Behavior

- Use a simple vertical form.
- Account type should be easy to select.
- Save button should be easy to reach.

---

# WF-007: Categories List

## Related Screen

Categories List

## Related Flow

UF-005: Create a Category

## Purpose

Show all categories available for classifying transactions.

## Header

The screen should show:

- Title: Categories.

## Main Content

The screen should include:

- List of categories.
- Category name.
- Category icon.
- Category color.
- Create category button.

## Main Actions

- Create category.

## Empty State

If no categories exist:

- Show message: No categories yet.
- Show button: Create your first category.

## Validation and Error Messages

Possible messages:

- Unable to load categories.

## Mobile Behavior

- Categories should be shown as a simple list or grid.
- Icon and color should make categories easy to identify.

---

# WF-008: Create Category

## Related Screen

Create Category

## Related Flow

UF-005: Create a Category

## Purpose

Allow a family member to create a category for classifying income and expenses.

## Header

The screen should show:

- Title: Create category.

## Main Content

The screen should include:

- Category name field.
- Color selector.
- Icon selector.
- Save button.

## Main Actions

- Save category.
- Cancel and return to Categories List.

## Empty State

Not required.

## Validation and Error Messages

Possible messages:

- Category name is required.
- A category with this name already exists.
- Unable to create category. Please try again.

## Mobile Behavior

- Color selector should be simple.
- Icon selector should not overload the screen.
- Save button should be easy to reach.

---

# WF-009: Add Expense

## Related Screen

Add Expense

## Related Flow

UF-006: Register an Expense

## Purpose

Allow a family member to register an expense quickly.

## Header

The screen should show:

- Title: Add expense.

## Main Content

The screen should include:

- Amount field.
- Account selector.
- Category selector.
- Description field.
- Transaction date field.
- Save expense button.

## Main Actions

- Save expense.
- Cancel and return to previous screen.

## Empty State

If no accounts exist:

- Show message explaining that an account is required.
- Show action to create an account.

If no categories exist:

- Show message explaining that a category is required.
- Show action to create a category.

## Validation and Error Messages

Possible messages:

- Amount is required.
- Amount must be greater than zero.
- Account is required.
- Category is required.
- Transaction date is invalid.
- Unable to register expense. Please try again.

## Mobile Behavior

- The amount field should be prominent.
- Account and category selectors should be fast to use.
- The form should allow quick entry in a few taps.

---

# WF-010: Add Income

## Related Screen

Add Income

## Related Flow

UF-007: Register an Income

## Purpose

Allow a family member to register income.

## Header

The screen should show:

- Title: Add income.

## Main Content

The screen should include:

- Amount field.
- Account selector.
- Category selector.
- Description field.
- Transaction date field.
- Save income button.

## Main Actions

- Save income.
- Cancel and return to previous screen.

## Empty State

If no accounts exist:

- Show message explaining that an account is required.
- Show action to create an account.

If no categories exist:

- Show message explaining that a category is required.
- Show action to create a category.

## Validation and Error Messages

Possible messages:

- Amount is required.
- Amount must be greater than zero.
- Account is required.
- Category is required.
- Transaction date is invalid.
- Unable to register income. Please try again.

## Mobile Behavior

- The amount field should be prominent.
- Form should be similar to Add Expense for consistency.

---

# WF-011: Add Transfer

## Related Screen

Add Transfer

## Related Flow

UF-008: Register a Transfer

## Purpose

Allow a family member to move money between accounts.

## Header

The screen should show:

- Title: Add transfer.

## Main Content

The screen should include:

- Amount field.
- Source account selector.
- Destination account selector.
- Description field.
- Transaction date field.
- Save transfer button.

## Main Actions

- Save transfer.
- Cancel and return to previous screen.

## Empty State

If fewer than two accounts exist:

- Show message explaining that at least two accounts are required.
- Show action to create another account.

## Validation and Error Messages

Possible messages:

- Amount is required.
- Amount must be greater than zero.
- Source account is required.
- Destination account is required.
- Source and destination accounts must be different.
- Transaction date is invalid.
- Unable to register transfer. Please try again.

## Mobile Behavior

- Source and destination account selectors should be clear.
- The user should easily understand the transfer direction.

---

# WF-012: Budgets List

## Related Screen

Budgets List

## Related Flow

UF-014: View Budget Progress

## Purpose

Show family budgets and their progress.

## Header

The screen should show:

- Title: Budgets.
- Period filter.

## Main Content

The screen should include:

- List of budgets.
- Budget name.
- Category.
- Planned amount.
- Spent amount.
- Remaining amount.
- Percentage used.
- Exceeded status.
- Create budget button.

## Main Actions

- Create budget.
- Change period filter.
- View budget details if supported later.

## Empty State

If no budgets exist:

- Show message: No budgets yet.
- Show button: Create your first budget.

## Validation and Error Messages

Possible messages:

- Unable to load budgets.
- Unable to calculate budget progress.

## Mobile Behavior

- Budget progress should be visual.
- Exceeded budgets should be easy to identify.
- Budget cards should be simple and readable.

---

# WF-013: Create Budget

## Related Screen

Create Budget

## Related Flow

UF-009: Create a Budget

## Purpose

Allow a family member to create a budget for a category and period.

## Header

The screen should show:

- Title: Create budget.

## Main Content

The screen should include:

- Budget name field.
- Category selector.
- Planned amount field.
- Period type selector:
  - Monthly
  - Yearly
  - Custom date range
- Month and year selector when Monthly is selected.
- Year selector when Yearly is selected.
- Start date and end date when Custom date range is selected.
- Save budget button.

## Main Actions

- Save budget.
- Cancel and return to Budgets List.
- Copy a completed budget to the next period from Budgets List.

## Empty State

If no categories exist:

- Show message explaining that a category is required.
- Show action to create a category.

## Validation and Error Messages

Possible messages:

- Budget name is required.
- Category is required.
- Planned amount must be greater than zero.
- Period type is required.
- Month and year are required for monthly budgets.
- Year is required for yearly budgets.
- Start date and end date are required for custom budgets.
- Start date must be before end date.
- A budget already exists for this category and period.
- Unable to create budget. Please try again.

## Mobile Behavior

- Show only the date fields needed for the selected period type.
- Keep the form compact.
- Save button should be easy to reach.

---

# WF-014: Recurring Payments List

## Related Screen

Recurring Payments List

## Related Flow

UF-015: View Upcoming Recurring Payments

## Purpose

Show upcoming recurring financial obligations.

## Header

The screen should show:

- Title: Recurring payments.

## Main Content

The screen should include:

- List of recurring payments.
- Payment name.
- Expected amount.
- Frequency.
- Next due date.
- Suggested account.
- Suggested category.
- Status.
- Mark as paid action.
- Create recurring payment button.

## Main Actions

- Create recurring payment.
- Mark payment as paid.

## Empty State

If no recurring payments exist:

- Show message: No recurring payments yet.
- Show button: Create your first recurring payment.

## Validation and Error Messages

Possible messages:

- Unable to load recurring payments.
- Unable to update recurring payment status.

## Mobile Behavior

- Payments should be ordered by next due date.
- Pending payments should be easy to identify.
- Mark as paid should be visible but protected from accidental taps.

---

# WF-015: Create Recurring Payment

## Related Screen

Create Recurring Payment

## Related Flow

UF-010: Create a Recurring Payment

## Purpose

Allow a family member to create a recurring payment.

## Header

The screen should show:

- Title: Create recurring payment.

## Main Content

The screen should include:

- Payment name field.
- Expected amount field.
- Frequency selector.
- Next due date field.
- Suggested account selector.
- Suggested category selector.
- Save button.

## Main Actions

- Save recurring payment.
- Cancel and return to Recurring Payments List.

## Empty State

Not required.

## Validation and Error Messages

Possible messages:

- Payment name is required.
- Expected amount must be greater than zero.
- Frequency is required.
- Next due date is required.
- Unable to create recurring payment. Please try again.

## Mobile Behavior

- Keep the form simple.
- Suggested account and category should be optional.
- Date selection should be mobile-friendly.

---

# WF-016: Mark Recurring Payment as Paid

## Related Screen

Mark Recurring Payment as Paid

## Related Flow

UF-011: Mark a Recurring Payment as Paid

## Purpose

Allow a family member to confirm a recurring payment and create the related expense.

## Header

The screen should show:

- Title: Mark as paid.
- Recurring payment name.

## Main Content

The screen should include:

- Payment name.
- Expected amount.
- Editable payment amount.
- Account selector.
- Category selector.
- Payment date field.
- Confirm payment button.

## Main Actions

- Confirm payment.
- Cancel and return to Recurring Payments List.

## Empty State

Not required.

## Validation and Error Messages

Possible messages:

- Payment amount must be greater than zero.
- Account is required.
- Category is required.
- Payment date is invalid.
- Unable to mark payment as paid. Please try again.

## Mobile Behavior

- Confirmation should be clear.
- The action should create an expense, so the user must understand the financial impact.
- Avoid accidental confirmation.

---

# WF-017: Reports

## Related Screen

Reports

## Related Flows

- UF-013: View Expenses by Category
- UF-014: View Budget Progress

## Purpose

Allow a family member to analyze income, expenses, categories, and budgets.

## Header

The screen should show:

- Title: Reports.
- Period filter.

## Main Content

The screen should include:

- Expenses by category.
- Income summary.
- Expense summary.
- Category totals.
- Budget usage summary.
- Period filter:
  - Monthly
  - Yearly
  - Custom date range

## Main Actions

- Change report period.
- View category spending.
- View budget usage.

## Empty State

If no transactions exist for the selected period:

- Show message explaining that no data is available.
- Suggest registering income or expenses.

## Validation and Error Messages

Possible messages:

- Unable to load reports.
- Invalid custom date range.
- Unable to calculate report data.

## Mobile Behavior

- Reports should be visual but simple.
- Use cards and summaries.
- Avoid overloading the user with too many charts in the MVP.

---

# WF-018: Family Members

## Related Screen

Family Members

## Related Flow

UF-003: Invite a Family Member

## Purpose

Show members and pending invitations for the selected family.

## Header

The screen should show:

- Title: Family members.

## Main Content

The screen should include:

- List of active family members.
- Member name.
- Member email.
- Member role.
- Pending invitations.
- Invitation status.
- Invite member button.

## Main Actions

- Invite member.
- View members.
- Remove member if allowed by role.

## Empty State

If the family has only one member:

- Show the current user as the owner.
- Suggest inviting another member.

## Validation and Error Messages

Possible messages:

- Unable to load family members.
- Unable to load invitations.
- Unable to remove member.

## Mobile Behavior

- Members should be shown as cards or a simple list.
- Pending invitations should be visually different from active members.

---

# WF-019: Invite Family Member

## Related Screen

Invite Family Member

## Related Flow

UF-003: Invite a Family Member

## Purpose

Allow a family owner to invite another user to the family.

## Header

The screen should show:

- Title: Invite member.

## Main Content

The screen should include:

- Email field.
- Role selector.
- Send invitation button.

## Main Actions

- Send invitation.
- Cancel and return to Family Members.

## Empty State

Not required.

## Validation and Error Messages

Possible messages:

- Email is required.
- Email format is invalid.
- Role is required.
- This user already belongs to the family.
- An invitation is already pending for this email.
- Unable to send invitation. Please try again.

## Mobile Behavior

- Form should be short.
- Email input should use an email keyboard on mobile.
- Confirmation should be shown after sending the invitation.

---

# WF-020: Settings

## Related Screen

Settings

## Related Flow

UF-001: Sign in with Google

## Purpose

Allow the user or family owner to configure basic preferences.

## Header

The screen should show:

- Title: Settings.

## Main Content

The screen should include:

- Application language selector:
  - English
  - Spanish
- Family main currency selector:
  - COP
  - USD
- Family name.
- Current user profile information.

## Main Actions

- Change language.
- Change family main currency if allowed.
- Update family name if allowed.

## Empty State

Not required.

## Validation and Error Messages

Possible messages:

- Unable to update language.
- Unable to update currency.
- Unable to update family settings.

## Mobile Behavior

- Settings should be grouped in simple sections.
- Currency change should show a warning if changing it affects existing financial data.

---

# Application Shell Profile Menu

## Purpose

Allow the authenticated user to view basic profile context and sign out from the main application shell.

## Main Content

The profile menu should include:

- Authenticated user name.
- Current family role.
- Sign out action.

## Mobile Behavior

- The profile menu should be opened from the top-right profile icon.
- The sign out action should live in this profile menu instead of the Settings screen.

---

# Wireframe Planning Summary

The MVP wireframe planning covers these screens:

- WF-001: Welcome / Sign In
- WF-002: Create Family
- WF-003: Select Family
- WF-004: Family Dashboard
- WF-005: Accounts List
- WF-006: Create Account
- WF-007: Categories List
- WF-008: Create Category
- WF-009: Add Expense
- WF-010: Add Income
- WF-011: Add Transfer
- WF-012: Budgets List
- WF-013: Create Budget
- WF-014: Recurring Payments List
- WF-015: Create Recurring Payment
- WF-016: Mark Recurring Payment as Paid
- WF-017: Reports
- WF-018: Family Members
- WF-019: Invite Family Member
- WF-020: Settings
