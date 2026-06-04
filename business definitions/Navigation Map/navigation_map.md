# Personal and Family Finance App - Navigation Map

## Goal

Define how users move between the main screens of the MVP.

---

# 1. Entry Navigation

## First App Access

When the user opens the app:

1. The system shows the Welcome / Sign In screen.
2. The user signs in with Google.
3. The system redirects the user based on their family status.

## Routing Rules After Sign In

* If the user has no family, redirect to Create Family.
* If the user belongs to one family, redirect to Family Dashboard.
* If the user belongs to multiple families, redirect to Select Family.

---

# 2. Main Mobile Navigation

The app should use a simple mobile-first navigation structure.

## Recommended Bottom Navigation

The main bottom navigation should include:

* Dashboard
* Transactions
* Budgets
* Reports
* More

## Reason

This keeps the most common actions accessible from mobile.

---

# 3. Dashboard Navigation

## Screen

Family Dashboard

## Accessible From

* After sign in.
* After selecting a family.
* Bottom navigation: Dashboard.

## Main Actions

From the dashboard, the user can access:

* Add Expense
* Add Income
* Add Transfer
* View Accounts
* View Budgets
* View Recurring Payments
* View Reports

---

# 4. Transactions Navigation

## Screen Group

Transactions

## Suggested Screens

* Add Expense
* Add Income
* Add Transfer

## Access

The user can access transaction actions from:

* Dashboard quick actions.
* Bottom navigation.
* Floating action button.

## Recommended Mobile Behavior

Use a primary floating action button:

* Tap "+".
* Show options:

  * Add Expense
  * Add Income
  * Add Transfer

---

# 5. Budgets Navigation

## Screen Group

Budgets

## Screens

* Budgets List
* Create Budget

## Access

The user can access budgets from:

* Bottom navigation: Budgets.
* Dashboard budget summary.

## Flow

1. User opens Budgets.
2. System shows Budgets List.
3. User selects Create Budget.
4. System shows Create Budget screen.
5. After saving, user returns to Budgets List.

---

# 6. Reports Navigation

## Screen

Reports

## Access

The user can access reports from:

* Bottom navigation: Reports.
* Dashboard report summaries.

## Available Views

Reports should include:

* Expenses by category.
* Income summary.
* Expense summary.
* Budget usage summary.

---

# 7. More Menu Navigation

## Screen Group

More

## Purpose

Group secondary features that should not overload the bottom navigation.

## More Menu Items

* Accounts
* Categories
* Recurring Payments
* Family Members
* Settings

---

# 8. Accounts Navigation

## Screens

* Accounts List
* Create Account

## Access

The user can access accounts from:

* More menu.
* Dashboard balance summary.

## Flow

1. User opens Accounts.
2. System shows Accounts List.
3. User selects Create Account.
4. System shows Create Account screen.
5. After saving, user returns to Accounts List.

---

# 9. Categories Navigation

## Screens

* Categories List
* Create Category

## Access

The user can access categories from:

* More menu.
* Transaction forms.
* Budget forms.

## Flow

1. User opens Categories.
2. System shows Categories List.
3. User selects Create Category.
4. System shows Create Category screen.
5. After saving, user returns to Categories List.

---

# 10. Recurring Payments Navigation

## Screens

* Recurring Payments List
* Create Recurring Payment
* Mark Recurring Payment as Paid

## Access

The user can access recurring payments from:

* More menu.
* Dashboard upcoming payments summary.

## Flow

1. User opens Recurring Payments.
2. System shows Recurring Payments List.
3. User can create a recurring payment.
4. User can mark a pending recurring payment as paid.
5. When marked as paid, the system creates an expense.
6. User returns to Recurring Payments List.

---

# 11. Family Members Navigation

## Screens

* Family Members
* Invite Family Member

## Access

The user can access family members from:

* More menu.

## Flow

1. User opens Family Members.
2. System shows current members and pending invitations.
3. User selects Invite Member.
4. System shows Invite Family Member screen.
5. After sending invitation, user returns to Family Members.

---

# 12. Settings Navigation

## Screen

Settings

## Access

The user can access settings from:

* More menu.

## Settings Options

* Change application language:

  * Spanish
  * English
* View or update family name.
* View or update family main currency:

  * COP
  * USD
* View user profile information.
* Sign out.

---

# 13. Family Selection Navigation

## Screen

Select Family

## Access

The user sees this screen when:

* The user belongs to multiple families after sign in.
* The user manually changes the active family from the app menu.

## Flow

1. User opens Select Family.
2. System shows families where the user is an active member.
3. User selects a family.
4. System sets that family as the active family.
5. System redirects to the selected Family Dashboard.

---

# 14. Suggested Navigation Structure

## Bottom Navigation

* Dashboard
* Transactions
* Budgets
* Reports
* More

## Floating Action Button

* Add Expense
* Add Income
* Add Transfer

## More Menu

* Accounts
* Categories
* Recurring Payments
* Family Members
* Settings
* Select Family

---

# 15. Navigation Summary

The MVP navigation should prioritize:

* Fast transaction registration.
* Quick access to the dashboard.
* Simple access to budgets and reports.
* Secondary configuration grouped under More.
* Clear family selection when the user belongs to multiple families.
