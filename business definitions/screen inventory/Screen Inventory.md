# Personal and Family Finance App - Screen Inventory

## Goal

Define the screens required for the MVP before creating wireframes in Figma.

---

# 1. Welcome / Sign In

## Purpose

Allow the user to access the application.

## Main Elements

* App name or logo.
* Short product message.
* "Sign in with Google" button.
* Language selector if needed before login.

## Related Flow

* UF-001: Sign in with Google

---

# 2. Create Family

## Purpose

Allow a new authenticated user to create their first family workspace.

## Main Elements

* Family name field.
* Main currency selector:

  * COP
  * USD
* Create family button.
* Validation messages.

## Related Flow

* UF-002: Create a Family

---

# 3. Select Family

## Purpose

Allow a user who belongs to multiple families to select the active family.

## Main Elements

* List of families.
* Family name.
* User role in each family.
* Option to create another family.
* Option to enter selected family.

## Related Flow

* UF-001: Sign in with Google

---

# 4. Family Dashboard

## Purpose

Show the family’s financial summary.

## Main Elements

* Selected family name.
* Total available balance.
* Total income for selected period.
* Total expenses for selected period.
* Budget progress summary.
* Upcoming recurring payments.
* Expenses by category summary.
* Period filter:

  * Monthly
  * Yearly
  * Custom date range
* Quick actions:

  * Add expense
  * Add income
  * Add transfer

## Related Flow

* UF-016: View Financial Dashboard

---

# 5. Accounts List

## Purpose

Show all family accounts and their balances.

## Main Elements

* List of accounts.
* Account name.
* Account type.
* Current balance.
* Credit card owed balance shown separately.
* Total available balance.
* Create account button.

## Related Flow

* UF-012: View Account Balances

---

# 6. Create Account

## Purpose

Allow a family member to create a real financial account.

## Main Elements

* Account name field.
* Account type selector:

  * Savings
  * Cash
  * Digital Wallet
  * Credit Card
* Initial balance field.
* Save button.
* Validation messages.

## Related Flow

* UF-004: Create an Account

---

# 7. Categories List

## Purpose

Show all family categories.

## Main Elements

* List of categories.
* Category name.
* Category icon.
* Category color.
* Create category button.

## Related Flow

* UF-005: Create a Category

---

# 8. Create Category

## Purpose

Allow a family member to create a transaction category.

## Main Elements

* Category name field.
* Color selector.
* Icon selector.
* Save button.
* Validation messages.

## Related Flow

* UF-005: Create a Category

---

# 9. Add Expense

## Purpose

Allow a family member to register an expense quickly.

## Main Elements

* Amount field.
* Account selector.
* Category selector.
* Description field.
* Transaction date field.
* Save expense button.
* Validation messages.

## Related Flow

* UF-006: Register an Expense

---

# 10. Add Income

## Purpose

Allow a family member to register income.

## Main Elements

* Amount field.
* Account selector.
* Category selector.
* Description field.
* Transaction date field.
* Save income button.
* Validation messages.

## Related Flow

* UF-007: Register an Income

---

# 11. Add Transfer

## Purpose

Allow a family member to transfer money between accounts.

## Main Elements

* Amount field.
* Source account selector.
* Destination account selector.
* Description field.
* Transaction date field.
* Save transfer button.
* Validation messages.

## Related Flow

* UF-008: Register a Transfer

---

# 12. Budgets List

## Purpose

Show family budgets and their progress.

## Main Elements

* List of budgets.
* Budget name.
* Category.
* Planned amount.
* Spent amount.
* Remaining amount.
* Percentage used.
* Exceeded status.
* Period filter.
* Create budget button.

## Related Flow

* UF-014: View Budget Progress

---

# 13. Create Budget

## Purpose

Allow a family member to create a budget for a category and period.

## Main Elements

* Budget name field.
* Category selector.
* Planned amount field.
* Period type selector:

  * Monthly
  * Yearly
  * Custom date range
* Month and year selector.
* Year selector.
* Start date field.
* End date field.
* Save budget button.
* Validation messages.

## Related Flow

* UF-009: Create a Budget

---

# 14. Recurring Payments List

## Purpose

Show upcoming recurring financial obligations.

## Main Elements

* List of recurring payments.
* Payment name.
* Expected amount.
* Frequency.
* Next due date.
* Suggested account.
* Suggested category.
* Status.
* Mark as paid action.
* Create recurring payment button.

## Related Flow

* UF-015: View Upcoming Recurring Payments

---

# 15. Create Recurring Payment

## Purpose

Allow a family member to create a recurring payment.

## Main Elements

* Payment name field.
* Expected amount field.
* Frequency selector.
* Next due date field.
* Suggested account selector.
* Suggested category selector.
* Save button.
* Validation messages.

## Related Flow

* UF-010: Create a Recurring Payment

---

# 16. Mark Recurring Payment as Paid

## Purpose

Allow a family member to confirm a recurring payment and create the related expense.

## Main Elements

* Payment name.
* Expected amount.
* Editable payment amount.
* Account selector.
* Category selector.
* Payment date field.
* Confirm payment button.
* Validation messages.

## Related Flow

* UF-011: Mark a Recurring Payment as Paid

---

# 17. Reports

## Purpose

Allow a family member to analyze income, expenses, and categories.

## Main Elements

* Period filter:

  * Monthly
  * Yearly
  * Custom date range
* Expenses by category.
* Income summary.
* Expense summary.
* Category totals.
* Budget usage summary.

## Related Flow

* UF-013: View Expenses by Category
* UF-014: View Budget Progress

---

# 18. Family Members

## Purpose

Show members who belong to the family.

## Main Elements

* List of family members.
* Member name.
* Member email.
* Member role.
* Invitation status.
* Invite member button.

## Related Flow

* UF-003: Invite a Family Member

---

# 19. Invite Family Member

## Purpose

Allow the family owner to invite another person to the family.

## Main Elements

* Email field.
* Role selector.
* Send invitation button.
* Validation messages.

## Related Flow

* UF-003: Invite a Family Member

---

# 20. Settings

## Purpose

Allow the user or family owner to configure basic preferences.

## Main Elements

* Application language:

  * Spanish
  * English
* Family main currency:

  * COP
  * USD
* Family name.
* Current user profile information.
* Sign out button.

## Related Flow

* UF-001: Sign in with Google

---

# Screen Inventory Summary

The MVP requires these screens:

* Welcome / Sign In
* Create Family
* Select Family
* Family Dashboard
* Accounts List
* Create Account
* Categories List
* Create Category
* Add Expense
* Add Income
* Add Transfer
* Budgets List
* Create Budget
* Recurring Payments List
* Create Recurring Payment
* Mark Recurring Payment as Paid
* Reports
* Family Members
* Invite Family Member
* Settings
