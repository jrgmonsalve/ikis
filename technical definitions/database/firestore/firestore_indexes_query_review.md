# Personal and Family Finance App - Firestore Indexes and Query Review

## Goal

Define the main Firestore query patterns and likely composite indexes required for the MVP.

This document is based on:

- Firestore Data Model.
- Screen Inventory.
- User Flows.
- Business Rules.
- Security Rules Strategy.

---

# 1. Firestore Structure Assumed

The query review assumes this structure:

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

---

# 2. General Query Principles

## Family-Scoped Queries

Most queries should be scoped to the selected family.

Example:

    families/{familyId}/transactions

This helps with:

- Security.
- Query simplicity.
- Performance.
- Clear data ownership.

## Use transactionDate for Financial Reports

Reports, dashboards, budgets, and period filters must use:

    transactionDate

not:

    createdAt

Reason:

A user may register a transaction today that belongs to a previous financial period.

## Use Status Instead of Deletion

Most queries should filter by:

    status == "active"

This prevents inactive or cancelled records from appearing in normal app views.

## Keep Queries Simple

Firestore performs best when queries are designed around known access patterns.

Avoid trying to make Firestore behave like a relational database with joins.

---

# 3. Query Patterns by Screen

---

# 3.1 Welcome / Sign In

## Screen

Welcome / Sign In

## Query

Read user profile after authentication.

Path:

    users/{userId}

## Query Type

Direct document read.

## Index Required

No custom index required.

---

# 3.2 Create Family

## Screen

Create Family

## Writes

Create:

    families/{familyId}

Create owner member:

    families/{familyId}/members/{userId}

Optional update:

    users/{userId}.defaultFamilyId

## Query Type

Direct writes.

## Index Required

No custom index required.

## Notes

Family creation and owner member creation should be committed together using a batch write or server-side function.

---

# 3.3 Select Family

## Screen

Select Family

## Query Option A: Collection Group Query

Collection group:

    members

Filters:

    userId == currentUserId
    status == "active"

Then fetch each related family document.

## Suggested Index

Collection group index:

| Collection Group | Fields |
|---|---|
| members | userId ASC, status ASC |

## Query Option B: User Family References

Alternative structure:

    users/{userId}/familyRefs/{familyId}

This can make family selection faster.

## Recommendation for MVP

Start with collection group query on members.

If family selection becomes expensive, add:

    users/{userId}/familyRefs/{familyId}

---

# 3.4 Family Dashboard

## Screen

Family Dashboard

## Data Needed

- Total available balance.
- Income for selected period.
- Expenses for selected period.
- Budget progress summary.
- Upcoming recurring payments.
- Expenses by category.

## Queries

### Query 1: Active Accounts

Path:

    families/{familyId}/accounts

Filters:

    status == "active"

### Query 2: Transactions by Period

Path:

    families/{familyId}/transactions

Filters:

    status == "active"
    transactionDate >= startDate
    transactionDate <= endDate

Sort:

    transactionDate DESC

### Query 3: Active Budgets

Path:

    families/{familyId}/budgets

Filters:

    status == "active"

Optional filters:

    startDate <= selectedEndDate
    endDate >= selectedStartDate

### Query 4: Upcoming Recurring Payments

Path:

    families/{familyId}/recurringPayments

Filters:

    status == "active"
    nextDueDate >= currentDate

Sort:

    nextDueDate ASC

## Suggested Indexes

| Collection | Fields |
|---|---|
| transactions | status ASC, transactionDate DESC |
| recurringPayments | status ASC, nextDueDate ASC |
| budgets | status ASC, startDate ASC |
| budgets | status ASC, endDate ASC |

## Notes

For small MVP datasets, dashboard data can be calculated on demand.

If reads become expensive, introduce:

    families/{familyId}/dashboardSnapshots/{snapshotId}

---

# 3.5 Accounts List

## Screen

Accounts List

## Query

Path:

    families/{familyId}/accounts

Filters:

    status == "active"

Sort:

    name ASC

## Suggested Index

Usually no composite index is needed for a simple equality filter and order by, but Firestore may request one depending on query shape.

Possible index:

| Collection | Fields |
|---|---|
| accounts | status ASC, name ASC |

## Notes

currentBalance is stored on account documents for fast reads.

---

# 3.6 Create Account

## Screen

Create Account

## Writes

Create:

    families/{familyId}/accounts/{accountId}

## Query

No required read query except optional validation.

## Index Required

No custom index required.

---

# 3.7 Categories List

## Screen

Categories List

## Query

Path:

    families/{familyId}/categories

Filters:

    status == "active"

Sort:

    name ASC

## Suggested Index

| Collection | Fields |
|---|---|
| categories | status ASC, name ASC |

## Notes

Use normalizedName for duplicate validation.

---

# 3.8 Create Category

## Screen

Create Category

## Duplicate Validation Query

Path:

    families/{familyId}/categories

Filters:

    normalizedName == selectedNormalizedName
    status == "active"

## Suggested Index

| Collection | Fields |
|---|---|
| categories | normalizedName ASC, status ASC |

## Notes

Firestore does not enforce uniqueness automatically.

For stronger duplicate prevention, consider deterministic document IDs or Cloud Functions.

---

# 3.9 Add Expense

## Screen

Add Expense

## Reads Needed

### Active Accounts

Path:

    families/{familyId}/accounts

Filters:

    status == "active"

### Active Categories

Path:

    families/{familyId}/categories

Filters:

    status == "active"

## Writes Needed

Create:

    families/{familyId}/transactions/{transactionId}

Update:

    families/{familyId}/accounts/{accountId}.currentBalance

## Suggested Indexes

Reads use existing indexes:

| Collection | Fields |
|---|---|
| accounts | status ASC, name ASC |
| categories | status ASC, name ASC |

## Notes

Expense creation should be atomic with account balance update.

Recommended:

- Cloud Function, or
- Firestore transaction.

---

# 3.10 Add Income

## Screen

Add Income

## Reads Needed

### Active Accounts

Path:

    families/{familyId}/accounts

Filters:

    status == "active"

### Active Categories

Path:

    families/{familyId}/categories

Filters:

    status == "active"

## Writes Needed

Create:

    families/{familyId}/transactions/{transactionId}

Update:

    families/{familyId}/accounts/{accountId}.currentBalance

## Notes

Income creation should be atomic with account balance update.

---

# 3.11 Add Transfer

## Screen

Add Transfer

## Reads Needed

### Active Accounts

Path:

    families/{familyId}/accounts

Filters:

    status == "active"

## Writes Needed

Create:

    families/{familyId}/transactions/{transactionId}

Update:

    families/{familyId}/accounts/{sourceAccountId}.currentBalance

Update:

    families/{familyId}/accounts/{destinationAccountId}.currentBalance

## Notes

Transfer creation must be atomic because it affects two accounts.

Recommended:

- Cloud Function, or
- Firestore transaction.

---

# 3.12 Budgets List

## Screen

Budgets List

## Query Option A: All Active Budgets

Path:

    families/{familyId}/budgets

Filters:

    status == "active"

Sort:

    name ASC

## Query Option B: Budgets by Year

Path:

    families/{familyId}/budgets

Filters:

    status == "active"
    year == selectedYear

## Query Option C: Budgets by Period Overlap

Path:

    families/{familyId}/budgets

Filters:

    status == "active"
    startDate <= selectedEndDate

Then filter in app:

    endDate >= selectedStartDate

## Suggested Indexes

| Collection | Fields |
|---|---|
| budgets | status ASC, name ASC |
| budgets | status ASC, year ASC |
| budgets | status ASC, startDate ASC |

## Notes

Firestore has limitations when querying overlapping date ranges.

For MVP, query by status and startDate, then filter small result sets in the application.

---

# 3.13 Create Budget

## Screen

Create Budget

## Reads Needed

### Active Categories

Path:

    families/{familyId}/categories

Filters:

    status == "active"

## Duplicate Validation Query

Path:

    families/{familyId}/budgets

Filters:

    status == "active"
    categoryId == selectedCategoryId
    periodType == selectedPeriodType
    startDate == selectedStartDate
    endDate == selectedEndDate

## Suggested Index

| Collection | Fields |
|---|---|
| budgets | status ASC, categoryId ASC, periodType ASC, startDate ASC, endDate ASC |

## Notes

Normalize all periods into startDate and endDate.

This simplifies duplicate validation and budget usage calculations.

---

# 3.14 Recurring Payments List

## Screen

Recurring Payments List

## Query

Path:

    families/{familyId}/recurringPayments

Filters:

    status == "active"

Sort:

    nextDueDate ASC

## Suggested Index

| Collection | Fields |
|---|---|
| recurringPayments | status ASC, nextDueDate ASC |

## Notes

The dashboard can reuse the same query but limit the result count.

---

# 3.15 Create Recurring Payment

## Screen

Create Recurring Payment

## Reads Needed

### Optional Active Accounts

Path:

    families/{familyId}/accounts

Filters:

    status == "active"

### Optional Active Categories

Path:

    families/{familyId}/categories

Filters:

    status == "active"

## Write

Create:

    families/{familyId}/recurringPayments/{recurringPaymentId}

## Index Required

No additional custom index beyond existing account/category queries.

---

# 3.16 Mark Recurring Payment as Paid

## Screen

Mark Recurring Payment as Paid

## Reads Needed

Read:

    families/{familyId}/recurringPayments/{recurringPaymentId}

Read active accounts and categories if user needs to confirm or change them.

## Writes Needed

Create:

    families/{familyId}/transactions/{transactionId}

Update:

    families/{familyId}/accounts/{accountId}.currentBalance

Update:

    families/{familyId}/recurringPayments/{recurringPaymentId}.nextDueDate

Update:

    families/{familyId}/recurringPayments/{recurringPaymentId}.lastPaidAt

## Notes

This operation affects multiple documents.

Recommended:

- Cloud Function.

Reason:

It creates a real expense and updates recurring payment state.

---

# 3.17 Reports

## Screen

Reports

## Query: Transactions by Period

Path:

    families/{familyId}/transactions

Filters:

    status == "active"
    transactionDate >= startDate
    transactionDate <= endDate

Sort:

    transactionDate DESC

## Query: Expenses by Category and Period

Path:

    families/{familyId}/transactions

Filters:

    status == "active"
    type == "expense"
    categoryId == selectedCategoryId
    transactionDate >= startDate
    transactionDate <= endDate

Sort:

    transactionDate DESC

## Query: Income by Period

Path:

    families/{familyId}/transactions

Filters:

    status == "active"
    type == "income"
    transactionDate >= startDate
    transactionDate <= endDate

Sort:

    transactionDate DESC

## Suggested Indexes

| Collection | Fields |
|---|---|
| transactions | status ASC, transactionDate DESC |
| transactions | status ASC, type ASC, transactionDate DESC |
| transactions | status ASC, type ASC, categoryId ASC, transactionDate DESC |

## Notes

For expenses grouped by category, two approaches are possible:

## Option A: Query all expenses for period and group in app

Good for MVP and small datasets.

## Option B: Query per category

Good when the user opens a specific category detail.

Recommendation:

Start with Option A.

---

# 3.18 Family Members

## Screen

Family Members

## Query

Path:

    families/{familyId}/members

Filters:

    status in ["active", "inactive"]

Sort:

    displayName ASC

## Suggested Index

| Collection | Fields |
|---|---|
| members | status ASC, displayName ASC |

## Notes

Firestore supports in queries, but indexing may be required.

For MVP, query all members and filter removed members in the app if the list is small.

---

# 3.19 Invite Family Member

## Screen

Invite Family Member

## Duplicate Invitation Query

Path:

    families/{familyId}/invitations

Filters:

    email == invitedEmail
    status == "pending"

## Existing Member Check

Path:

    families/{familyId}/members

Query by email:

    email == invitedEmail
    status == "active"

## Suggested Indexes

| Collection | Fields |
|---|---|
| invitations | email ASC, status ASC |
| members | email ASC, status ASC |

## Notes

If member document ID is userId, checking by email requires a query.

This is acceptable for MVP.

---

# 3.20 Settings

## Screen

Settings

## Reads

Read:

    users/{userId}

Read:

    families/{familyId}

## Writes

Update preferred language:

    users/{userId}.preferredLanguage

Update family settings if owner:

    families/{familyId}.name
    families/{familyId}.mainCurrency

## Index Required

No custom index required.

## Notes

Changing family currency after transactions exist should be restricted or carefully handled.

Recommendation for MVP:

- Allow selecting family currency during family creation.
- Disable currency changes after transactions exist, or show a warning and restrict the operation.

---

# 4. Composite Index Summary

The following indexes are likely needed.

## Collection: accounts

| Query Purpose | Fields |
|---|---|
| Active accounts by name | status ASC, name ASC |

## Collection: categories

| Query Purpose | Fields |
|---|---|
| Active categories by name | status ASC, name ASC |
| Duplicate category validation | normalizedName ASC, status ASC |

## Collection: transactions

| Query Purpose | Fields |
|---|---|
| Transactions by period | status ASC, transactionDate DESC |
| Income or expense by period | status ASC, type ASC, transactionDate DESC |
| Expenses by category and period | status ASC, type ASC, categoryId ASC, transactionDate DESC |
| Account transactions by period | status ASC, accountId ASC, transactionDate DESC |
| Category transactions by period | status ASC, categoryId ASC, transactionDate DESC |

## Collection: budgets

| Query Purpose | Fields |
|---|---|
| Active budgets by name | status ASC, name ASC |
| Budgets by year | status ASC, year ASC |
| Budgets by start date | status ASC, startDate ASC |
| Duplicate budget validation | status ASC, categoryId ASC, periodType ASC, startDate ASC, endDate ASC |

## Collection: recurringPayments

| Query Purpose | Fields |
|---|---|
| Upcoming recurring payments | status ASC, nextDueDate ASC |

## Collection: invitations

| Query Purpose | Fields |
|---|---|
| Duplicate pending invitation | email ASC, status ASC |
| Expired invitations | status ASC, expiresAt ASC |

## Collection: members

| Query Purpose | Fields |
|---|---|
| Members by status and name | status ASC, displayName ASC |
| Existing member by email | email ASC, status ASC |

## Collection Group: members

| Query Purpose | Fields |
|---|---|
| Find families for user | userId ASC, status ASC |

---

# 5. Dashboard Query Strategy

## MVP Strategy

For MVP, calculate dashboard values on demand.

Required reads:

- Active accounts.
- Transactions for selected period.
- Active budgets.
- Upcoming recurring payments.

## Pros

- Simple implementation.
- No aggregation infrastructure needed.
- Good for small datasets.

## Cons

- More reads as the dataset grows.
- Dashboard may become slower with many transactions.
- Cost can increase with heavy usage.

## Future Strategy

Use cached dashboard documents:

    families/{familyId}/dashboardSnapshots/{snapshotId}

Examples:

    current
    monthly_2026_06
    yearly_2026

## Recommended Trigger Points

Update cached summaries when:

- A transaction is created.
- A transaction is cancelled.
- A budget is created or updated.
- A recurring payment is marked as paid.
- An account is created or updated.

## Recommended Implementation

Use Cloud Functions for aggregation when needed.

---

# 6. Budget Query Strategy

## MVP Strategy

When displaying budgets:

1. Load active budgets.
2. For each budget, query matching expenses by:
   - type == expense
   - categoryId == budget.categoryId
   - transactionDate within budget period
3. Calculate spent amount and remaining amount.

## Alternative Strategy

Store budget calculated fields:

- spentAmount
- remainingAmount
- percentageUsed

Update them when expense transactions change.

## Recommendation

For MVP:

- Store calculated fields if you want fast reads.
- Recalculate through Cloud Functions or controlled transaction logic.

If avoiding Cloud Functions initially:

- Calculate on demand for small datasets.

---

# 7. Account History Query Concern

## Issue

Income and expenses use:

    accountId

Transfers use:

    sourceAccountId
    destinationAccountId

Therefore, showing a complete account history may require multiple queries:

1. Income/expense where accountId == selectedAccountId.
2. Transfers where sourceAccountId == selectedAccountId.
3. Transfers where destinationAccountId == selectedAccountId.

## MVP Recommendation

Do not include detailed account history in MVP unless required.

If later required, consider creating:

    families/{familyId}/accountMovements/{movementId}

Each movement would represent the effect of a transaction on one account.

Example:

    Transaction: Transfer Bancolombia to Nequi

Creates:

    Movement 1: Bancolombia -300000
    Movement 2: Nequi +300000

This makes account history queries much easier.

---

# 8. Cost and Performance Considerations

## Avoid Loading All Transactions

Do not load all family transactions for every dashboard or report.

Always filter by period.

## Use Pagination

For transaction lists, use:

- limit
- startAfter
- orderBy transactionDate

## Use Cached Balances

Store currentBalance on accounts.

Do not calculate account balances from all transactions every time.

## Use Aggregations Later

If the app grows, introduce:

- dashboardSnapshots
- monthly summaries
- category summaries
- account movement summaries

## Keep Documents Small

Avoid storing large arrays inside documents.

Use subcollections for growing lists.

Bad idea:

    family.transactions = [large array]

Good idea:

    families/{familyId}/transactions/{transactionId}

---

# 9. Recommended MVP Index Creation Order

Create indexes as needed during development.

Priority indexes:

## Priority 1

- transactions: status ASC, transactionDate DESC
- transactions: status ASC, type ASC, transactionDate DESC
- transactions: status ASC, type ASC, categoryId ASC, transactionDate DESC
- recurringPayments: status ASC, nextDueDate ASC

## Priority 2

- categories: normalizedName ASC, status ASC
- budgets: status ASC, categoryId ASC, periodType ASC, startDate ASC, endDate ASC
- invitations: email ASC, status ASC
- members collection group: userId ASC, status ASC

## Priority 3

- accounts: status ASC, name ASC
- categories: status ASC, name ASC
- budgets: status ASC, name ASC
- members: status ASC, displayName ASC

---

# 10. Recommended Next Step

After this document, the next step is:

## Technical Architecture

That section should define:

- Frontend architecture.
- Firebase services.
- Authentication flow.
- Firestore access layer.
- Cloud Functions strategy.
- Hosting.
- Environment configuration.
- CI/CD approach.
- Folder structure.
