# Personal and Family Finance App - Firestore Security Rules Draft

## Goal

Provide a first draft of the Firestore security rules for the MVP.

This draft is based on:

- Family-based data isolation.
- Owner, Admin, and Member roles.
- Cloud Firestore subcollections under families.
- Basic validation for allowed values.
- Soft delete strategy using status fields.
- Protection against cross-family access.

---

# 1. Important Notes

This is a first security rules draft.

Before production, it should be tested using:

- Firebase Emulator Suite.
- Unit tests for allowed and denied access.
- Manual tests for each role.
- Edge cases for cross-family access.
- Validation tests for invalid data.

---

# 2. Recommended Firestore Structure

The rules assume this structure:

    users/{userId}

    families/{familyId}
      members/{userId}
      invitations/{invitationId}
      accounts/{accountId}
      categories/{categoryId}
        subcategories/{subcategoryId}
      transactions/{transactionId}
      budgets/{budgetId}
      recurringPayments/{recurringPaymentId}
      dashboardSnapshots/{snapshotId}

The member document ID should be the Firebase Auth UID.

Example:

    families/{familyId}/members/{request.auth.uid}

This makes role and membership checks easier.

---

# 3. Main Security Principles

## Authentication Required

Financial data cannot be accessed by unauthenticated users.

## Family Membership Required

A user can access a family only if they have an active member document inside that family.

## Role-Based Writes

The rules distinguish between:

- Owner
- Admin
- Member

## Soft Delete

Important financial documents should not be permanently deleted.

The rules deny direct deletion for:

- Families
- Members
- Invitations
- Accounts
- Categories
- Subcategories
- Transactions
- Budgets
- Recurring payments

Use status fields instead.

---

# 4. Role Permissions Applied in This Draft

## Owner

Can:

- Read family data.
- Update family settings.
- Manage members.
- Manage invitations.
- Manage accounts.
- Manage categories.
- Manage subcategories.
- Manage budgets.
- Manage recurring payments.
- Read and create transactions.
- Cancel transactions.

## Admin

Can:

- Read family data.
- Manage accounts.
- Manage categories.
- Manage subcategories.
- Manage budgets.
- Manage recurring payments.
- Read and create transactions.
- Cancel transactions.

Cannot:

- Manage members.
- Invite members.
- Update family settings.

## Member

Can:

- Read family data.
- Create transactions.
- View accounts, categories, subcategories, budgets, recurring payments, reports, and dashboard data.

Cannot:

- Manage accounts.
- Manage categories.
- Manage subcategories.
- Manage budgets.
- Manage recurring payments.
- Manage members.
- Invite members.
- Update family settings.

---

# 5. Financial Consistency Warning

Firestore security rules are not enough to guarantee financial consistency.

Operations like these affect multiple documents:

- Register expense.
- Register income.
- Register transfer.
- Mark recurring payment as paid.
- Cancel transaction.

Recommended implementation:

- Use Cloud Functions for critical financial writes.
- Keep direct client writes to transactions blocked.

The generated rules should allow members to read transactions but should not allow direct transaction creation, update, or delete from the client.

Cloud Functions that create income or expense transactions must validate any subcategoryId against the selected family and parent category.

---

# 6. Dashboard Snapshots

The draft denies direct writes to:

    families/{familyId}/dashboardSnapshots/{snapshotId}

Recommended approach:

- Read allowed for active family members.
- Write only from backend using Firebase Admin SDK or Cloud Functions.

Admin SDK bypasses Firestore security rules, so backend code must still validate logic carefully.

---

# 7. Generated Files

This package includes:

- firestore.rules
- personal_family_finance_app_firestore_security_rules_draft.md

---

# 8. Recommended Next Step

After this draft, the next step is:

## Indexes and Query Review

That section should define:

- Required Firestore composite indexes.
- Main query patterns.
- Dashboard query strategy.
- Cost/performance considerations.
