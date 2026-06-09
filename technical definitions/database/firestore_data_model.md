# Personal and Family Finance App - Firestore Data Model

## Goal

Design the Cloud Firestore data model for the Personal and Family Finance App MVP.

This model is based on the approved Domain Model and optimized for:

- Family-based financial data isolation.
- Mobile-first PWA usage.
- Manual transaction registration.
- Fast dashboard reads.
- Security rules by family membership.
- Future scalability.

---

# 1. Firestore Modeling Strategy

## Recommended Strategy

Use a family-centered structure.

Most financial data belongs to a family, so it should be stored under the family document as subcollections.

Recommended structure:

    users/{userId}
    families/{familyId}
    families/{familyId}/members/{memberId}
    families/{familyId}/invitations/{invitationId}
    families/{familyId}/accounts/{accountId}
    families/{familyId}/categories/{categoryId}
    families/{familyId}/categories/{categoryId}/subcategories/{subcategoryId}
    families/{familyId}/transactions/{transactionId}
    families/{familyId}/budgets/{budgetId}
    families/{familyId}/recurringPayments/{recurringPaymentId}
    families/{familyId}/dashboardSnapshots/{snapshotId}

## Why this structure

This structure is recommended because:

- Almost all business data belongs to a family.
- Security rules can be based on family membership.
- It avoids mixing data between families.
- Queries are naturally scoped to one family.
- It maps well to the mobile app navigation.

---

# 2. Collection Overview

## Top-Level Collections

The MVP uses these top-level collections:

- users
- families

## Family Subcollections

Each family document contains these subcollections:

- members
- invitations
- accounts
- categories
- categories/{categoryId}/subcategories
- transactions
- budgets
- recurringPayments
- dashboardSnapshots

---

# 3. Collection: users

## Path

    users/{userId}

## Purpose

Stores user profile information from Google authentication and app preferences.

## Document ID

Use the Firebase Authentication UID as userId.

## Example Document

    {
      "id": "user_123",
      "googleProviderId": "google_abc",
      "email": "rene@example.com",
      "displayName": "Rene Garcia",
      "photoUrl": "https://example.com/photo.jpg",
      "preferredLanguage": "en",
      "defaultFamilyId": "family_123",
      "createdAt": "2026-06-04T10:00:00Z",
      "updatedAt": "2026-06-04T10:00:00Z",
      "lastLoginAt": "2026-06-04T10:00:00Z",
      "status": "active"
    }

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | yes | Same as Firebase Auth UID |
| googleProviderId | string | yes | Google provider identifier |
| email | string | yes | User email |
| displayName | string | yes | User display name |
| photoUrl | string | no | User profile image |
| preferredLanguage | string | yes | en or es |
| defaultFamilyId | string | no | Last selected or default family |
| createdAt | timestamp | yes | Creation date |
| updatedAt | timestamp | yes | Last update date |
| lastLoginAt | timestamp | no | Last login date |
| status | string | yes | active or inactive |

## Notes

Do not store financial data inside the user document.

Financial data belongs to families.

---

# 4. Collection: families

## Path

    families/{familyId}

## Purpose

Stores the family workspace.

## Document ID

Use an auto-generated Firestore ID.

## Example Document

    {
      "id": "family_123",
      "name": "Garcia Family",
      "mainCurrency": "COP",
      "ownerUserId": "user_123",
      "activePeriod": {
        "periodType": "monthly",
        "month": 6,
        "year": 2026,
        "customStart": null,
        "customEnd": null
      },
      "createdAt": "2026-06-04T10:00:00Z",
      "updatedAt": "2026-06-04T10:00:00Z",
      "status": "active"
    }

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | yes | Family ID |
| name | string | yes | Family name |
| mainCurrency | string | yes | COP or USD |
| ownerUserId | string | yes | User ID of the owner |
| activePeriod | map | no | Family-wide active period used by dashboard and new budgets |
| createdAt | timestamp | yes | Creation date |
| updatedAt | timestamp | yes | Last update date |
| status | string | yes | active or inactive |

## Notes

Each family has one main currency in the MVP.

The MVP does not support mixed currencies inside the same family.

Existing family documents without activePeriod should fall back to the current monthly period in the client until Settings is saved.

---

# 5. Subcollection: members

## Path

    families/{familyId}/members/{memberId}

## Purpose

Stores users who belong to a family and their role.

## Document ID Recommendation

Use the userId as memberId.

This makes membership checks easier in Firestore security rules.

## Example Document

    {
      "id": "user_123",
      "familyId": "family_123",
      "userId": "user_123",
      "email": "rene@example.com",
      "displayName": "Rene Garcia",
      "role": "owner",
      "joinedAt": "2026-06-04T10:00:00Z",
      "status": "active"
    }

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | yes | Same as userId |
| familyId | string | yes | Parent family ID |
| userId | string | yes | User ID |
| email | string | yes | Denormalized for display |
| displayName | string | yes | Denormalized for display |
| role | string | yes | owner, admin, member |
| joinedAt | timestamp | yes | Join date |
| status | string | yes | active, inactive, removed |

## Notes

Denormalizing email and displayName improves UI reads.

The source of truth for the user profile remains users/{userId}.

---

# 6. Subcollection: invitations

## Path

    families/{familyId}/invitations/{invitationId}

## Purpose

Stores pending, accepted, expired, or cancelled invitations.

## Document ID

Use an auto-generated Firestore ID.

## Example Document

    {
      "id": "invitation_123",
      "familyId": "family_123",
      "email": "wife@example.com",
      "role": "member",
      "invitedByUserId": "user_123",
      "status": "pending",
      "createdAt": "2026-06-04T10:00:00Z",
      "expiresAt": "2026-06-11T10:00:00Z",
      "acceptedAt": null
    }

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | yes | Invitation ID |
| familyId | string | yes | Parent family ID |
| email | string | yes | Invited email |
| role | string | yes | admin or member |
| invitedByUserId | string | yes | User who sent invitation |
| status | string | yes | pending, accepted, expired, cancelled |
| createdAt | timestamp | yes | Creation date |
| expiresAt | timestamp | yes | Expiration date |
| acceptedAt | timestamp | no | Acceptance date |

## Suggested Indexes

- email + status
- status + expiresAt

## Notes

A family should not have duplicated pending invitations for the same email.

---

# 7. Subcollection: accounts

## Path

    families/{familyId}/accounts/{accountId}

## Purpose

Stores financial accounts for a family.

## Document ID

Use an auto-generated Firestore ID.

## Example Document

    {
      "id": "account_123",
      "familyId": "family_123",
      "name": "Nequi",
      "type": "digital_wallet",
      "initialBalance": 1000000,
      "currentBalance": 800000,
      "currency": "COP",
      "createdByUserId": "user_123",
      "createdAt": "2026-06-04T10:00:00Z",
      "updatedAt": "2026-06-04T10:00:00Z",
      "status": "active"
    }

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | yes | Account ID |
| familyId | string | yes | Parent family ID |
| name | string | yes | Account name |
| type | string | yes | savings, cash, digital_wallet, credit_card |
| initialBalance | number | yes | Starting balance |
| currentBalance | number | yes | Stored for performance |
| currency | string | yes | COP or USD |
| createdByUserId | string | yes | Creator |
| createdAt | timestamp | yes | Creation date |
| updatedAt | timestamp | yes | Last update date |
| status | string | yes | active or inactive |

## Account Types

- savings
- cash
- digital_wallet
- credit_card

## Notes

currentBalance is denormalized for fast reads.

Balance updates should be handled atomically when creating transactions.

---

# 8. Subcollection: categories

## Path

    families/{familyId}/categories/{categoryId}

## Purpose

Stores categories used to classify income and expenses.

## Document ID

Use an auto-generated Firestore ID.

## Example Document

    {
      "id": "category_123",
      "familyId": "family_123",
      "name": "Food",
      "normalizedName": "food",
      "color": "#16A34A",
      "icon": "utensils",
      "createdByUserId": "user_123",
      "createdAt": "2026-06-04T10:00:00Z",
      "updatedAt": "2026-06-04T10:00:00Z",
      "status": "active"
    }

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | yes | Category ID |
| familyId | string | yes | Parent family ID |
| name | string | yes | Category display name |
| normalizedName | string | yes | Lowercase name for duplicate validation |
| color | string | no | UI color |
| icon | string | no | UI icon name |
| createdByUserId | string | yes | Creator |
| createdAt | timestamp | yes | Creation date |
| updatedAt | timestamp | yes | Last update date |
| status | string | yes | active or inactive |

## Suggested Indexes

- normalizedName + status

## Notes

Firestore does not enforce uniqueness automatically.

Category uniqueness must be enforced by application logic or a deterministic document strategy.

Recommended MVP approach:

- Use auto-generated categoryId.
- Store normalizedName.
- Validate duplicates before creation.
- Optionally use a transaction or Cloud Function to reduce race conditions.

---

## Subcollection under categories: subcategories

## Path

    families/{familyId}/categories/{categoryId}/subcategories/{subcategoryId}

## Purpose

Stores optional subcategories used to classify income and expenses more specifically under a parent category.

## Document ID

Use an auto-generated Firestore ID.

## Example Document

    {
      "id": "subcategory_123",
      "familyId": "family_123",
      "categoryId": "category_food",
      "name": "Groceries",
      "normalizedName": "groceries",
      "createdByUserId": "user_123",
      "createdAt": "2026-06-04T10:00:00Z",
      "updatedAt": "2026-06-04T10:00:00Z",
      "status": "active"
    }

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | yes | Subcategory ID |
| familyId | string | yes | Parent family ID |
| categoryId | string | yes | Parent category ID |
| name | string | yes | Subcategory display name |
| normalizedName | string | yes | Lowercase name for duplicate validation inside the category |
| createdByUserId | string | yes | Creator |
| createdAt | timestamp | yes | Creation date |
| updatedAt | timestamp | yes | Last update date |
| status | string | yes | active or inactive |

## Suggested Indexes

- normalizedName + status

## Notes

Subcategory names are unique only under the parent category. Different categories may have subcategories with the same name.

Subcategories are deactivated instead of physically deleted so historical transactions can keep their references.

Budgets remain tied to the parent category, not to subcategories.

---

# 9. Subcollection: transactions

## Path

    families/{familyId}/transactions/{transactionId}

## Purpose

Stores income, expenses, and transfers.

## Document ID

Use an auto-generated Firestore ID.

## Example: Expense

    {
      "id": "transaction_123",
      "familyId": "family_123",
      "type": "expense",
      "amount": 80000,
      "currency": "COP",
      "accountId": "account_nequi",
      "categoryId": "category_food",
      "subcategoryId": "subcategory_groceries",
      "description": "Groceries",
      "transactionDate": "2026-06-04T00:00:00Z",
      "createdByUserId": "user_123",
      "createdAt": "2026-06-04T10:00:00Z",
      "updatedAt": "2026-06-04T10:00:00Z",
      "status": "active",
      "source": "manual",
      "recurringPaymentId": null
    }

## Example: Transfer

    {
      "id": "transaction_789",
      "familyId": "family_123",
      "type": "transfer",
      "amount": 300000,
      "currency": "COP",
      "sourceAccountId": "account_bancolombia",
      "destinationAccountId": "account_nequi",
      "description": "Transfer to wallet",
      "transactionDate": "2026-06-04T00:00:00Z",
      "createdByUserId": "user_123",
      "createdAt": "2026-06-04T10:00:00Z",
      "updatedAt": "2026-06-04T10:00:00Z",
      "status": "active",
      "source": "manual",
      "recurringPaymentId": null
    }

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | yes | Transaction ID |
| familyId | string | yes | Parent family ID |
| type | string | yes | income, expense, transfer |
| amount | number | yes | Must be greater than zero |
| currency | string | yes | COP or USD |
| accountId | string | conditional | Required for income and expense |
| sourceAccountId | string | conditional | Required for transfer |
| destinationAccountId | string | conditional | Required for transfer |
| categoryId | string | conditional | Required for income and expense |
| subcategoryId | string | no | Required for income and expense only when the selected category has active subcategories |
| description | string | no | Optional |
| transactionDate | timestamp | yes | Financial date |
| createdByUserId | string | yes | Creator |
| createdAt | timestamp | yes | Creation date |
| updatedAt | timestamp | yes | Last update date |
| status | string | yes | active or cancelled |
| source | string | yes | manual or recurring_payment |
| recurringPaymentId | string | no | Present if created from recurring payment |

## Suggested Indexes

- type + transactionDate
- accountId + transactionDate
- categoryId + transactionDate
- status + transactionDate
- type + categoryId + transactionDate
- type + accountId + transactionDate

## Notes

Reports and budgets should use transactionDate, not createdAt.

Transaction creation should update account balances atomically.

Income and expense transactions always store the parent categoryId. If a subcategory is selected, subcategoryId stores that specific subcategory.

Budget usage continues to match by categoryId, so expenses with subcategories count toward the parent category budget.

For MVP, transactions should not be physically deleted.

Use status = cancelled if needed.

---

# 10. Subcollection: budgets

## Path

    families/{familyId}/budgets/{budgetId}

## Purpose

Stores budgets by category and period.

## Document ID

Use an auto-generated Firestore ID.

## Example Document

    {
      "id": "budget_123",
      "familyId": "family_123",
      "name": "Food Budget",
      "categoryId": "category_food",
      "plannedAmount": 1000000,
      "spentAmount": 650000,
      "remainingAmount": 350000,
      "percentageUsed": 65,
      "periodType": "monthly",
      "month": 6,
      "year": 2026,
      "startDate": "2026-06-01T00:00:00Z",
      "endDate": "2026-06-30T23:59:59Z",
      "currency": "COP",
      "createdByUserId": "user_123",
      "createdAt": "2026-06-04T10:00:00Z",
      "updatedAt": "2026-06-04T10:00:00Z",
      "status": "active"
    }

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | yes | Budget ID |
| familyId | string | yes | Parent family ID |
| name | string | yes | Budget name |
| categoryId | string | yes | Category controlled by the budget |
| plannedAmount | number | yes | Planned amount |
| spentAmount | number | yes | Can be calculated or cached |
| remainingAmount | number | yes | Can be calculated or cached |
| percentageUsed | number | yes | Can be calculated or cached |
| periodType | string | yes | monthly, yearly, custom |
| month | number | conditional | Required for monthly |
| year | number | conditional | Required for monthly and yearly |
| startDate | timestamp | yes | Derived or custom |
| endDate | timestamp | yes | Derived or custom |
| currency | string | yes | COP or USD |
| createdByUserId | string | yes | Creator |
| createdAt | timestamp | yes | Creation date |
| updatedAt | timestamp | yes | Last update date |
| status | string | yes | active or inactive |

## Suggested Indexes

- categoryId + startDate + endDate
- periodType + year
- status + startDate
- status + endDate

## Notes

For Firestore, storing startDate and endDate for all budget types simplifies queries.

Monthly and yearly periods can be normalized into startDate and endDate.

---

# 11. Subcollection: recurringPayments

## Path

    families/{familyId}/recurringPayments/{recurringPaymentId}

## Purpose

Stores recurring financial obligations.

## Document ID

Use an auto-generated Firestore ID.

## Example Document

    {
      "id": "recurring_123",
      "familyId": "family_123",
      "name": "Internet",
      "expectedAmount": 120000,
      "frequency": "monthly",
      "nextDueDate": "2026-06-15T00:00:00Z",
      "suggestedAccountId": "account_bancolombia",
      "suggestedCategoryId": "category_utilities",
      "currency": "COP",
      "createdByUserId": "user_123",
      "createdAt": "2026-06-04T10:00:00Z",
      "updatedAt": "2026-06-04T10:00:00Z",
      "status": "active",
      "lastPaidAt": null
    }

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | yes | Recurring payment ID |
| familyId | string | yes | Parent family ID |
| name | string | yes | Payment name |
| expectedAmount | number | yes | Expected amount |
| frequency | string | yes | weekly, biweekly, monthly, yearly, custom |
| nextDueDate | timestamp | yes | Next due date |
| suggestedAccountId | string | no | Optional |
| suggestedCategoryId | string | no | Optional |
| currency | string | yes | COP or USD |
| createdByUserId | string | yes | Creator |
| createdAt | timestamp | yes | Creation date |
| updatedAt | timestamp | yes | Last update date |
| status | string | yes | active or inactive |
| lastPaidAt | timestamp | no | Last payment date |

## Suggested Indexes

- status + nextDueDate
- suggestedAccountId + status
- suggestedCategoryId + status

## Notes

Recurring payments do not create expenses automatically.

When marked as paid, the system creates an expense transaction and updates nextDueDate.

---

# 12. Subcollection: dashboardSnapshots

## Path

    families/{familyId}/dashboardSnapshots/{snapshotId}

## Purpose

Stores optional cached dashboard summary data for faster reads.

## Document ID Recommendation

Use deterministic IDs based on period.

Examples:

    current
    monthly_2026_06
    yearly_2026

## Example Document

    {
      "id": "monthly_2026_06",
      "familyId": "family_123",
      "periodType": "monthly",
      "month": 6,
      "year": 2026,
      "startDate": "2026-06-01T00:00:00Z",
      "endDate": "2026-06-30T23:59:59Z",
      "totalAvailableBalance": 2470000,
      "totalIncome": 3500000,
      "totalExpenses": 1240000,
      "upcomingPaymentsCount": 3,
      "highestExpenseCategoryId": "category_food",
      "highestExpenseCategoryAmount": 650000,
      "currency": "COP",
      "calculatedAt": "2026-06-04T10:00:00Z"
    }

## Notes

This collection is optional for MVP.

For a first implementation, dashboard values can be calculated on demand.

If reads become expensive, use dashboardSnapshots or Cloud Functions for aggregation.

---

# 13. Recommended Query Patterns

## Get User Profile

Path:

    users/{userId}

Query type:

    Direct document read

## Get User Families

Recommended approach:

Use collection group query on members where userId equals current user ID and status equals active.

Query:

    collectionGroup("members")
    where("userId", "==", currentUserId)
    where("status", "==", "active")

Alternative:

Maintain user family references under:

    users/{userId}/familyRefs/{familyId}

This can make family selection faster.

## Get Family Accounts

Path:

    families/{familyId}/accounts

Filters:

    status == active

Sort:

    name ascending

## Get Transactions by Period

Path:

    families/{familyId}/transactions

Filters:

    status == active
    transactionDate >= startDate
    transactionDate <= endDate

Sort:

    transactionDate descending

## Get Expenses by Category and Period

Path:

    families/{familyId}/transactions

Filters:

    status == active
    type == expense
    categoryId == selectedCategoryId
    transactionDate >= startDate
    transactionDate <= endDate

## Get Upcoming Recurring Payments

Path:

    families/{familyId}/recurringPayments

Filters:

    status == active
    nextDueDate >= currentDate

Sort:

    nextDueDate ascending

---

# 14. Important Firestore Design Decisions

## Decision 1: Store currentBalance on Account

Recommended: Yes.

Reason:

- Makes dashboard and account list faster.
- Avoids recalculating balances from all transactions on every read.

Requirement:

- Must update currentBalance atomically when transactions are created, cancelled, or modified.

## Decision 2: Use Subcollections Under Family

Recommended: Yes.

Reason:

- Natural data isolation.
- Easier security rules.
- Simple family-scoped queries.

## Decision 3: Store familyId Inside Subcollection Documents

Recommended: Yes.

Reason:

- Useful for collection group queries.
- Useful for debugging and denormalized reads.
- Provides explicit ownership.

## Decision 4: Use Soft Delete / Status

Recommended: Yes.

Reason:

- Financial history should remain auditable.
- Deleted accounts or categories may be referenced by historical transactions.

## Decision 5: Cache Dashboard Data

Recommended: Optional for MVP.

Start with on-demand calculation if the dataset is small.

Add dashboardSnapshots later if performance or cost becomes an issue.

---

# 15. Account Balance Update Strategy

## Recommended Approach

When creating a transaction, use a Firestore transaction or server-side function to update account balances atomically.

## Expense

For normal accounts:

    account.currentBalance = account.currentBalance - amount

For credit card accounts:

    account.currentBalance = account.currentBalance + amount

Note:

For credit cards, currentBalance can represent owed amount.

## Income

    account.currentBalance = account.currentBalance + amount

## Transfer

    sourceAccount.currentBalance = sourceAccount.currentBalance - amount
    destinationAccount.currentBalance = destinationAccount.currentBalance + amount

## Important Rule

The transaction document and balance updates must be committed together.

If one operation fails, all operations should fail.

---

# 16. Suggested Security Rules Strategy

## Main Rule

A user can access a family document and its subcollections only if they are an active member of that family.

## Membership Check

Because member documents use userId as document ID, the rule can check:

    families/{familyId}/members/{request.auth.uid}

## Access Levels

## Owner

Can:

- Manage family settings.
- Invite members.
- Remove members.
- Manage accounts.
- Manage categories.
- Manage budgets.
- Manage recurring payments.
- View and create transactions.
- View reports.

## Admin

Can:

- Manage accounts.
- Manage categories.
- Manage budgets.
- Manage recurring payments.
- View and create transactions.
- View reports.

## Member

Can:

- View accounts.
- View categories.
- Create transactions.
- View budgets.
- View recurring payments.
- View reports.

## Notes

Firestore security rules should enforce:

- Authentication required.
- Family membership required.
- Role-based write permissions.
- FamilyId consistency.
- Users cannot write data into a family where they are not members.

---

# 17. Suggested Indexes

Firestore will request required composite indexes when queries fail, but the likely indexes are:

## Transactions

- type ascending, transactionDate descending
- status ascending, transactionDate descending
- type ascending, categoryId ascending, transactionDate descending
- type ascending, accountId ascending, transactionDate descending
- categoryId ascending, transactionDate descending
- accountId ascending, transactionDate descending

## Budgets

- status ascending, periodType ascending
- status ascending, year ascending
- categoryId ascending, startDate ascending, endDate ascending

## Recurring Payments

- status ascending, nextDueDate ascending

## Invitations

- email ascending, status ascending
- status ascending, expiresAt ascending

## Members Collection Group

- userId ascending, status ascending

---

# 18. MVP Firestore Structure Summary

Recommended structure:

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

This structure supports:

- Family-based isolation.
- Multi-user family management.
- Real accounts.
- Manual transactions.
- Budgets by period.
- Recurring payments.
- Dashboard and reports.
- Spanish and English preferences.
- COP and USD currency support.

---

# 19. Future Improvements

Future versions may add:

- users/{userId}/familyRefs/{familyId} for faster family selection.
- accountMovements subcollection for better account history.
- transactionSnapshots for historical account/category display.
- Cloud Functions for aggregation.
- Cloud Functions for recurring payment reminders.
- Exchange rate collection.
- Multi-currency support.
- Audit logs.
- Receipt attachments.
- Bank integration.
