# Personal and Family Finance App - Role Permissions Matrix and Firestore Security Rules Strategy

## Goal

Define the MVP role permissions and the Firestore security strategy for protecting family financial data.

This document covers:

- User roles.
- Permission matrix.
- Firestore access strategy.
- Family data isolation.
- Security rule design principles.
- Validation strategy.
- Recommended implementation notes.

---

# 1. Roles

The MVP supports three roles inside a family:

- Owner
- Admin
- Member

---

# 2. Role: Owner

## Description

The Owner is the user who created the family or the user who has full ownership of the family workspace.

## Main Capabilities

The Owner can:

- View all family financial data.
- Manage family settings.
- Invite members.
- Remove members.
- Manage accounts.
- Manage categories.
- Manage budgets.
- Manage recurring payments.
- Register transactions.
- View reports and dashboard.
- Change the family language-related preferences if applicable.
- Change the family main currency only if allowed by business rules.

## Restrictions

The Owner:

- Cannot be removed by another member.
- Should not be able to create invalid financial data.
- Should not bypass family data isolation rules.

---

# 3. Role: Admin

## Description

The Admin is a trusted family member with elevated permissions but without full ownership rights.

## Main Capabilities

The Admin can:

- View all family financial data.
- Create and manage accounts.
- Create and manage categories.
- Create and manage budgets.
- Create and manage recurring payments.
- Register transactions.
- View reports and dashboard.
- Invite members if allowed by the product decision.

## Restrictions

The Admin should not be able to:

- Remove the Owner.
- Change ownership.
- Delete the family.
- Change critical family settings without Owner permission.
- Access data from other families.

---

# 4. Role: Member

## Description

The Member is a regular family participant.

## Main Capabilities

The Member can:

- View family dashboard.
- View accounts.
- View categories.
- Register expenses.
- Register income.
- Register transfers.
- View budgets.
- View recurring payments.
- Mark recurring payments as paid.
- View reports.

## Restrictions

The Member should not be able to:

- Invite members.
- Remove members.
- Change family settings.
- Change family currency.
- Create or deactivate accounts if this is considered an admin action.
- Create or deactivate categories if this is considered an admin action.
- Create or deactivate budgets if this is considered an admin action.
- Create or deactivate recurring payments if this is considered an admin action.

---

# 5. Recommended MVP Permission Decision

For a simple MVP, the recommended permission model is:

## Owner

Full access.

## Admin

Can manage operational financial configuration:

- Accounts
- Categories
- Budgets
- Recurring payments
- Transactions

Cannot manage ownership or critical family settings.

## Member

Can register and view financial activity.

Cannot manage structural configuration.

This keeps the MVP simple and safe.

---

# 6. Role Permissions Matrix

| Feature / Action | Owner | Admin | Member |
|---|---:|---:|---:|
| View dashboard | Yes | Yes | Yes |
| View reports | Yes | Yes | Yes |
| View accounts | Yes | Yes | Yes |
| Create account | Yes | Yes | No |
| Update account | Yes | Yes | No |
| Deactivate account | Yes | Yes | No |
| View categories | Yes | Yes | Yes |
| Create category | Yes | Yes | No |
| Update category | Yes | Yes | No |
| Deactivate category | Yes | Yes | No |
| Register expense | Yes | Yes | Yes |
| Register income | Yes | Yes | Yes |
| Register transfer | Yes | Yes | Yes |
| Cancel transaction | Yes | Yes | No |
| View budgets | Yes | Yes | Yes |
| Create budget | Yes | Yes | No |
| Update budget | Yes | Yes | No |
| Deactivate budget | Yes | Yes | No |
| View recurring payments | Yes | Yes | Yes |
| Create recurring payment | Yes | Yes | No |
| Update recurring payment | Yes | Yes | No |
| Deactivate recurring payment | Yes | Yes | No |
| Mark recurring payment as paid | Yes | Yes | Yes |
| View family members | Yes | Yes | Yes |
| Invite family member | Yes | No | No |
| Remove family member | Yes | No | No |
| Change member role | Yes | No | No |
| Change family name | Yes | No | No |
| Change family main currency | Yes | No | No |
| Delete or deactivate family | Future | No | No |
| Change app language | Yes | Yes | Yes |
| Sign out | Yes | Yes | Yes |

---

# 7. Firestore Security Rules Strategy

## Main Security Principle

All financial data must be protected by family membership.

A user can read or write financial data only when:

- The user is authenticated.
- The user is an active member of the family.
- The user has the required role for the requested action.
- The document being accessed belongs to the selected family.

---

# 8. Recommended Firestore Structure for Security

The recommended structure is:

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

## Why this structure helps security

Using the userId as the member document ID allows security rules to check membership directly:

    families/{familyId}/members/{request.auth.uid}

This makes it easier to determine whether the authenticated user belongs to the family.

---

# 9. Core Security Checks

## Check 1: User is authenticated

Every protected operation must require authentication.

Rule concept:

    request.auth != null

## Check 2: User is an active family member

The user must have an active member document inside the family.

Rule concept:

    exists(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid))

and the member document must have:

    status == "active"

## Check 3: User has the required role

For role-based writes, check the member role.

Allowed roles:

- owner
- admin
- member

Example role groups:

    ownerOnly = ["owner"]
    adminOrOwner = ["owner", "admin"]
    anyActiveMember = ["owner", "admin", "member"]

---

# 10. Access Strategy by Collection

## users/{userId}

### Read

A user can read their own user profile.

### Create / Update

A user can create or update their own user profile.

### Restriction

A user cannot read or update another user profile directly.

### Rule Concept

    request.auth.uid == userId

---

## families/{familyId}

### Read

Active family members can read the family document.

### Create

An authenticated user can create a family.

### Update

Only the Owner can update family settings.

### Delete

Not recommended for MVP.

Use status-based deactivation in the future.

---

## families/{familyId}/members/{memberId}

### Read

Active family members can read the member list.

### Create

Usually created by the system when:

- A family is created.
- An invitation is accepted.

### Update

Only Owner can change member roles or status.

### Delete

Not recommended.

Use status values instead:

- active
- inactive
- removed

### Important Restriction

The Owner cannot be removed by another member.

---

## families/{familyId}/invitations/{invitationId}

### Read

Owner can read invitations.

Optional: Admin can read invitations if admins are later allowed to manage invitations.

### Create

Only Owner can create invitations in the MVP.

### Update

Owner can cancel invitations.

The invited user can accept an invitation only if the invitation email matches their authenticated email.

### Delete

Not recommended.

Use status:

- pending
- accepted
- expired
- cancelled

---

## families/{familyId}/accounts/{accountId}

### Read

Owner, Admin, and Member can read accounts.

### Create

Owner and Admin can create accounts.

### Update

Owner and Admin can update accounts.

### Deactivate

Owner and Admin can deactivate accounts.

### Delete

Not recommended if the account has transactions.

---

## families/{familyId}/categories/{categoryId}

### Read

Owner, Admin, and Member can read categories.

### Create

Owner and Admin can create categories.

### Update

Owner and Admin can update categories.

### Deactivate

Owner and Admin can deactivate categories.

### Delete

Not recommended if the category has transactions.

---

## families/{familyId}/transactions/{transactionId}

### Read

Owner, Admin, and Member can read transactions.

### Create

Owner, Admin, and Member can create transactions.

### Update

For MVP, transaction update should be restricted.

Recommended:

- Owner and Admin can cancel transactions.
- Member can create transactions but cannot cancel or edit existing ones.

### Delete

Not recommended.

Use status:

- active
- cancelled

### Important Note

Because transaction creation affects account balances, transaction creation should ideally be handled by backend logic or Cloud Functions, not directly by the client only.

If using client-side Firestore writes, use Firestore transactions carefully.

---

## families/{familyId}/budgets/{budgetId}

### Read

Owner, Admin, and Member can read budgets.

### Create

Owner and Admin can create budgets.

### Update

Owner and Admin can update budgets.

### Deactivate

Owner and Admin can deactivate budgets.

### Delete

Not recommended.

---

## families/{familyId}/recurringPayments/{recurringPaymentId}

### Read

Owner, Admin, and Member can read recurring payments.

### Create

Owner and Admin can create recurring payments.

### Update

Owner and Admin can update recurring payments.

### Mark as Paid

Owner, Admin, and Member can mark recurring payments as paid.

Important:

Marking as paid creates an expense transaction and updates the next due date.

This operation should be handled carefully to keep data consistent.

### Deactivate

Owner and Admin can deactivate recurring payments.

### Delete

Not recommended.

---

## families/{familyId}/dashboardSnapshots/{snapshotId}

### Read

Owner, Admin, and Member can read dashboard snapshots.

### Write

Should be system-managed if using Cloud Functions.

Users should not write dashboard snapshots directly unless there is a controlled process.

---

# 11. Validation Strategy in Security Rules

Firestore security rules should validate critical fields, but they should not contain complex business logic.

## Recommended Validation in Security Rules

Security rules should validate:

- Required authentication.
- Family membership.
- Role permissions.
- Document ownership.
- Allowed status values.
- Allowed role values.
- Allowed account types.
- Allowed transaction types.
- Allowed budget period types.
- Allowed currencies.
- Positive amounts.
- Basic field presence.
- FamilyId consistency.

## Avoid Complex Logic in Security Rules

Avoid putting these complex operations only in security rules:

- Balance recalculation.
- Budget usage calculation.
- Recurring payment next due date calculation.
- Duplicate category validation.
- Duplicate budget validation.
- Complex date overlap checks.
- Multi-document financial consistency.

These should be handled by:

- Application services.
- Cloud Functions.
- Firestore transactions.
- Backend API logic if used.

---

# 12. Allowed Values

## Languages

Allowed application languages:

- en
- es

## Currencies

Allowed currencies:

- COP
- USD

## Family Status

Allowed values:

- active
- inactive

## Member Roles

Allowed values:

- owner
- admin
- member

## Member Status

Allowed values:

- active
- inactive
- removed

## Account Types

Allowed values:

- savings
- cash
- digital_wallet
- credit_card

## Account Status

Allowed values:

- active
- inactive

## Category Status

Allowed values:

- active
- inactive

## Transaction Types

Allowed values:

- income
- expense
- transfer

## Transaction Status

Allowed values:

- active
- cancelled

## Budget Period Types

Allowed values:

- monthly
- yearly
- custom

## Budget Status

Allowed values:

- active
- inactive

## Recurring Payment Frequency

Allowed values:

- weekly
- biweekly
- monthly
- yearly
- custom

## Recurring Payment Status

Allowed values:

- active
- inactive

## Invitation Status

Allowed values:

- pending
- accepted
- expired
- cancelled

---

# 13. Write Strategy for Financial Consistency

## Important Problem

Transactions affect account balances.

Example:

- Creating an expense must create a transaction.
- The selected account balance must be reduced.
- Both operations must succeed together.

## Recommended Approach

For financial consistency, use one of these approaches:

## Option A: Cloud Functions

The client sends a request to create a transaction.

A Cloud Function:

- Validates permissions.
- Creates the transaction.
- Updates account balances.
- Updates recurring payment if needed.
- Updates dashboard snapshots if used.

## Option B: Firestore Client Transaction

The client uses a Firestore transaction to:

- Create the transaction document.
- Update the affected account balance.
- Update related recurring payment if needed.

## Recommendation for MVP

Use Firestore client transactions only if the app remains simple.

Use Cloud Functions if you want stronger server-side control over financial consistency.

Given this app handles financial data, Cloud Functions are recommended for critical operations.

Critical operations include:

- Create expense.
- Create income.
- Create transfer.
- Mark recurring payment as paid.
- Cancel transaction.

---

# 14. Security Rules Limitations

Firestore security rules cannot easily guarantee all business invariants.

Examples:

- They cannot easily prevent all duplicate category names under race conditions.
- They cannot easily calculate account balances.
- They cannot easily verify that budget spent amount is correct.
- They cannot easily update multiple documents safely by themselves.

Therefore:

- Use security rules for access control and basic validation.
- Use Cloud Functions or Firestore transactions for consistency.
- Use indexes for query performance.
- Use denormalization carefully.

---

# 15. Recommended Security Rule Helper Functions

The rules file should include helper functions conceptually like:

## isSignedIn

Returns true when the request has an authenticated user.

## isFamilyMember

Returns true when the authenticated user has an active member document in the family.

## getMemberRole

Returns the role of the authenticated user in the family.

## isOwner

Returns true when the authenticated user role is owner.

## isAdminOrOwner

Returns true when the authenticated user role is owner or admin.

## isActiveMember

Returns true when the authenticated user role is owner, admin, or member and the membership status is active.

## validCurrency

Validates that the currency is COP or USD.

## validAmount

Validates that amount is a number greater than zero.

## validTransactionType

Validates that transaction type is income, expense, or transfer.

## validAccountType

Validates that account type is savings, cash, digital_wallet, or credit_card.

---

# 16. MVP Security Recommendation

For MVP, use this practical strategy:

## Client Reads

Allow the client to read family financial data if:

- User is authenticated.
- User is an active member of the family.

## Client Writes

Allow simple writes from the client only when they do not affect multiple financial documents.

Examples:

- Create category.
- Create budget.
- Create recurring payment.
- Update user language.

## Controlled Writes

Use Cloud Functions or Firestore transactions for operations that affect balances or multiple documents.

Examples:

- Register expense.
- Register income.
- Register transfer.
- Mark recurring payment as paid.
- Cancel transaction.

## Owner-only Writes

Restrict critical family administration to Owner.

Examples:

- Invite members.
- Remove members.
- Change family settings.
- Change member roles.
- Change family main currency.

---

# 17. Specific Security Concerns

## FamilyId Tampering

A user should not be able to write a document with a different familyId than the path familyId.

Rule concept:

    request.resource.data.familyId == familyId

## CreatedByUserId Tampering

A user should not be able to create a document pretending to be another user.

Rule concept:

    request.resource.data.createdByUserId == request.auth.uid

## Role Escalation

A user should not be able to change their own role to admin or owner.

Only the Owner should change roles.

## Cross-Family Access

A user should never access financial data from a family where they are not an active member.

## Invalid Amounts

Amounts must be greater than zero.

## Invalid Currency

Currency must be COP or USD.

## Invalid Transaction Type

Transaction type must be income, expense, or transfer.

---

# 18. Recommended Next Step

After this document, the next implementation-level artifact should be:

## Firestore Security Rules Draft

That document should include a first version of the actual Firestore security rules file using the strategy defined here.

After that, we should create:

- Indexes and query review.
- Technical architecture.
- Firebase project setup checklist.
