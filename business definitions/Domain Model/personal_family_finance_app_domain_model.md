# Personal and Family Finance App - Domain Model

## Goal

Define the main business entities, attributes, relationships, and ownership rules for the personal and family finance application.

This document is database-independent. It describes the domain model first. The Firestore data model should be designed later based on this domain model and the required queries.

---

# 1. Domain Overview

The application allows users to manage personal or family finances inside a family workspace.

A family workspace contains:

- Members
- Accounts
- Categories
- Transactions
- Budgets
- Recurring payments
- Reports and dashboard calculations

The system supports:

- Individual finance management.
- Family finance management.
- Google authentication.
- Spanish and English.
- COP and USD as supported currencies.

---

# 2. Main Domain Entities

The core entities are:

- User
- Family
- FamilyMember
- Invitation
- Account
- Category
- Transaction
- Budget
- RecurringPayment

---

# 3. Entity: User

## Description

Represents a person who signs in to the platform.

## Main Attributes

- id
- googleProviderId
- email
- displayName
- photoUrl
- preferredLanguage
- createdAt
- updatedAt
- lastLoginAt
- status

## Allowed Status Values

- Active
- Inactive

## Relationships

- A user can belong to one or more families.
- A user can create one or more families.
- A user can receive invitations to join families.
- A user can create transactions, accounts, categories, budgets, and recurring payments inside a family, depending on permissions.

## Notes

The user is authenticated through Google. The platform does not manage passwords in the MVP.

---

# 4. Entity: Family

## Description

Represents a financial workspace where one or more users manage shared or personal finances.

## Main Attributes

- id
- name
- mainCurrency
- ownerUserId
- createdAt
- updatedAt
- status

## Supported Currencies

- COP
- USD

## Allowed Status Values

- Active
- Inactive

## Relationships

- A family has one owner.
- A family has many family members.
- A family has many accounts.
- A family has many categories.
- A family has many transactions.
- A family has many budgets.
- A family has many recurring payments.
- A family has many invitations.

## Notes

A family can represent:

- A single person.
- A couple.
- A household.
- A group of people managing shared finances.

---

# 5. Entity: FamilyMember

## Description

Represents the relationship between a user and a family.

## Main Attributes

- id
- familyId
- userId
- role
- joinedAt
- status

## Allowed Roles

- Owner
- Admin
- Member

## Allowed Status Values

- Active
- Inactive
- Removed

## Relationships

- A family member belongs to one family.
- A family member references one user.
- A family can have many family members.
- A user can be a member of many families.

## Ownership Rules

- The family creator becomes the initial owner.
- The owner has full control over the family workspace.
- The owner cannot be removed by another member.
- Members can access only the family data where they are active members.

## Notes

This entity is important because the same user may belong to multiple families in the future.

---

# 6. Entity: Invitation

## Description

Represents an invitation sent to a person to join a family.

## Main Attributes

- id
- familyId
- email
- role
- invitedByUserId
- status
- createdAt
- expiresAt
- acceptedAt

## Allowed Status Values

- Pending
- Accepted
- Expired
- Cancelled

## Relationships

- An invitation belongs to one family.
- An invitation is created by one user.
- An invitation may become a FamilyMember when accepted.

## Business Rules

- A user cannot join a family without accepting an invitation.
- A family should not have duplicate pending invitations for the same email.
- If the invited user is already a family member, the invitation should not be created.
- Expired invitations cannot be accepted.

## Notes

The invitation can be accepted after the invitee signs in with Google.

---

# 7. Entity: Account

## Description

Represents a real place where money exists or is owed.

## Main Attributes

- id
- familyId
- name
- type
- initialBalance
- currentBalance
- currency
- createdByUserId
- createdAt
- updatedAt
- status

## Account Types

- Savings
- Cash
- Digital Wallet
- Credit Card

## Allowed Status Values

- Active
- Inactive

## Relationships

- An account belongs to one family.
- An account can be used by many transactions.
- An account can be suggested for recurring payments.
- An account can be used as source or destination in transfers.

## Business Rules

- Income increases the selected account balance.
- Expense decreases the selected account balance for normal accounts.
- Transfers reduce the source account and increase the destination account.
- Credit card accounts represent owed money, not available money.
- Credit card balances are excluded from total available balance.
- Accounts with historical transactions should be deactivated instead of permanently deleted.

## Notes

The current balance can be stored for performance, but it must remain consistent with the transaction history.

---

# 8. Entity: Category

## Description

Represents a classification used for income and expenses.

## Main Attributes

- id
- familyId
- name
- color
- icon
- createdByUserId
- createdAt
- updatedAt
- status

## Allowed Status Values

- Active
- Inactive

## Relationships

- A category belongs to one family.
- A category can be used by many transactions.
- A category can be used by many budgets.
- A category can be suggested for recurring payments.

## Business Rules

- A family cannot have two active categories with the same name.
- Category name comparison should ignore uppercase and lowercase differences.
- Two different families can have categories with the same name.
- Categories with historical transactions should be deactivated instead of permanently deleted.

## Notes

The category color and icon help improve visual recognition in reports and transaction forms.

---

# 9. Entity: Transaction

## Description

Represents a financial movement inside a family.

## Main Attributes

- id
- familyId
- type
- amount
- currency
- accountId
- sourceAccountId
- destinationAccountId
- categoryId
- description
- transactionDate
- createdByUserId
- createdAt
- updatedAt
- status

## Transaction Types

- Income
- Expense
- Transfer

## Allowed Status Values

- Active
- Cancelled

## Relationships

- A transaction belongs to one family.
- A transaction is created by one user.
- An income transaction belongs to one account and one category.
- An expense transaction belongs to one account and one category.
- A transfer transaction has one source account and one destination account.
- A transaction can be created from a recurring payment when the payment is marked as paid.

## Business Rules

- Every transaction must belong to one family.
- Every transaction amount must be greater than zero.
- Every transaction must have a transaction date.
- Reports and budgets must use transactionDate, not createdAt.
- Income increases the selected account balance.
- Expense decreases the selected account balance.
- Transfer decreases the source account and increases the destination account.
- Transfer is not income or expense.
- Transfer must not affect budget usage.
- Transactions must only use accounts and categories from the same family.
- Historical transactions should remain available even if accounts or categories are later deactivated.

## Notes

A transaction should preserve historical accuracy. Future changes to account or category names should not break reports or history.

---

# 10. Entity: Budget

## Description

Represents a planned spending limit for a category and period.

## Main Attributes

- id
- familyId
- name
- categoryId
- plannedAmount
- spentAmount
- remainingAmount
- percentageUsed
- periodType
- month
- year
- startDate
- endDate
- currency
- createdByUserId
- createdAt
- updatedAt
- status

## Period Types

- Monthly
- Yearly
- CustomDateRange

## Allowed Status Values

- Active
- Inactive

## Relationships

- A budget belongs to one family.
- A budget belongs to one category.
- A budget is calculated from expense transactions matching its category and period.

## Business Rules

- Only expense transactions affect budget usage.
- Income transactions do not affect budget usage.
- Transfer transactions do not affect budget usage.
- The expense category must match the budget category.
- The expense transaction date must be inside the budget period.
- The spent amount is the sum of matching expenses.
- Remaining amount equals planned amount minus spent amount.
- If spent amount is greater than planned amount, the budget is exceeded.
- A family should not have duplicate active budgets for the same category and same period.

## Notes

Calculated values such as spentAmount, remainingAmount, and percentageUsed can be computed dynamically or stored for performance, depending on Firestore query needs.

---

# 11. Entity: RecurringPayment

## Description

Represents a repeated financial obligation.

## Main Attributes

- id
- familyId
- name
- expectedAmount
- frequency
- nextDueDate
- suggestedAccountId
- suggestedCategoryId
- currency
- createdByUserId
- createdAt
- updatedAt
- status

## Frequency Values

- Weekly
- Biweekly
- Monthly
- Yearly
- Custom

## Allowed Status Values

- Active
- Inactive

## Relationships

- A recurring payment belongs to one family.
- A recurring payment may reference a suggested account.
- A recurring payment may reference a suggested category.
- A recurring payment may create an expense transaction when marked as paid.

## Business Rules

- A recurring payment does not automatically create an expense.
- A recurring payment represents an expected obligation.
- The system may show it as pending.
- The system may remind the user about it.
- The system must not reduce the account balance before payment confirmation.
- When marked as paid, the system creates an expense transaction.
- After payment confirmation, the system updates the next due date according to the frequency.

## Notes

Recurring payments are not categories. They are independent domain concepts with their own lifecycle.

---

# 12. Relationship Summary

## User and Family

- One user can belong to many families.
- One family can have many users through FamilyMember.
- One family has one owner.

## Family and Financial Data

- One family has many accounts.
- One family has many categories.
- One family has many transactions.
- One family has many budgets.
- One family has many recurring payments.
- One family has many invitations.

## Account and Transaction

- One account can have many income transactions.
- One account can have many expense transactions.
- One account can be the source of many transfers.
- One account can be the destination of many transfers.

## Category and Transaction

- One category can classify many income transactions.
- One category can classify many expense transactions.
- Transfers do not require a category.

## Category and Budget

- One category can have many budgets.
- A budget belongs to one category.
- Budget usage is calculated from expenses in the same category and period.

## Recurring Payment and Transaction

- One recurring payment may create many expense transactions over time.
- Each created expense should reference the recurring payment that generated it, if applicable.

---

# 13. Ownership and Access Rules

## Family Scope

All financial data must be scoped by family.

This applies to:

- Accounts
- Categories
- Transactions
- Budgets
- Recurring payments
- Reports
- Dashboard calculations

## User Access

A user can access a family only if they are an active member of that family.

## Selected Family

When a user belongs to multiple families, all actions must be performed inside the currently selected family.

## Data Isolation

Data from one family must never be mixed with data from another family.

---

# 14. Language and Currency Rules

## Language

The MVP supports:

- English
- Spanish

The user can select their preferred language.

The system should display:

- Labels
- Menus
- Validation messages
- Main application content

in the selected language.

User-created content, such as category names or descriptions, is not automatically translated.

## Currency

The MVP supports:

- COP
- USD

Each family has one main currency.

Accounts, transactions, budgets, recurring payments, reports, and dashboard values should use the selected family currency.

The MVP does not include:

- Exchange rate conversion.
- Automatic exchange rate updates.
- Multi-currency accounts.
- Reports combining multiple currencies.

---

# 15. Future Domain Concepts

The following concepts are out of scope for MVP and can be added in future versions:

- Debt
- Loan
- Receivable
- Payable
- FinancialGoal
- ReceiptAttachment
- BankConnection
- ExchangeRate
- Notification
- AuditLog
- CategoryTemplate

---

# 16. Firestore Modeling Notes

This domain model should later be adapted to Cloud Firestore.

Firestore design should be based on:

- Required queries.
- Security rules.
- Family-based data isolation.
- Mobile performance.
- Offline behavior, if needed later.
- Denormalization where it improves reads.

Possible Firestore modeling approaches include:

- Top-level collections with familyId fields.
- Subcollections under families.
- Denormalized read models for dashboards and reports.
- Aggregated balance documents for performance.

The Firestore data model should not be created only by translating entities directly into collections. It should be designed around the app’s access patterns and security requirements.

---

# 17. Domain Model Summary

The MVP domain model includes:

- User
- Family
- FamilyMember
- Invitation
- Account
- Category
- Transaction
- Budget
- RecurringPayment

The model is focused on:

- Family-based financial management.
- Manual transaction registration.
- Real account balance tracking.
- Budget control.
- Recurring payment tracking.
- Reports and dashboard summaries.
- Spanish and English support.
- COP and USD support.
