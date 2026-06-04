# Personal and Family Finance App - Domain v1

## Product Focus

The application helps individuals and families manage their finances by:

* Controlling expenses.
* Managing real accounts.
* Tracking available money.
* Managing monthly budgets.
* Tracking recurring payments.
* Allowing multiple users to collaborate within the same family.

---

# Core Domain Concepts

## 1. User

A person who registers in the platform.

### Examples

* Rene
* Rene's wife
* Another family member

### Notes

A user can belong to one or more families in the future, but for the first version we can start with one main family per user.

---

## 2. Family

A financial group where one or more users manage shared finances.

### Examples

* Garcia Family
* Perez Family
* Personal Finance

### Notes

A family can represent:

* A real family.
* A couple.
* A single person managing personal finances.

---

## 3. FamilyMember

Represents the relationship between a user and a family.

### Possible Roles

* Owner
* Admin
* Member

### Notes

This concept allows the system to know:

* Who belongs to a family.
* What permissions each person has.
* Who can invite other users.
* Who can manage accounts, budgets, and categories.

---

## 4. Account

Represents a real place where money exists or is owed.

### Examples

* Bancolombia Savings
* Nequi
* Cash
* Credit Card
* Daviplata

### Possible Account Types

* Savings
* Checking
* Cash
* Digital Wallet
* Credit Card

### Notes

Each transaction should affect an account balance.

Example:

```
Account: Nequi
Current Balance: $1,000,000

Expense: Groceries - $200,000

New Balance: $800,000
```

---

## 5. Category

Used to classify transactions.

### Examples

* Food
* Transport
* Utilities
* Health
* Education
* Entertainment

### Notes

A category helps the user understand where the money is going.

Example:

```
Expense: $50,000
Category: Food
Account: Nequi
```

---

## 6. Transaction

Represents a money movement.

### Initial Transaction Types

* Income
* Expense
* Transfer

### Examples

```
Income: Salary
Expense: Groceries
Transfer: Bancolombia to Nequi
```

### Notes

Transactions are the base for calculating:

* Account balance.
* Monthly expenses.
* Budget usage.
* Reports.

---

## 7. Budget

Represents a planned spending limit for a period.

### Example

```
Category: Food
Month: June
Budget: $1,000,000
Spent: $650,000
Available: $350,000
```

### Notes

For v1, budgets should probably be monthly and category-based.

---

## 8. RecurringPayment

Represents a repeated financial obligation.

### Examples

* Rent
* Internet
* Netflix
* School
* Insurance
* Administration fee

### Possible Attributes

* Name
* Expected amount
* Frequency
* Next due date
* Suggested account
* Suggested category
* Status

### Notes

A recurring payment is not a category.

It is a separate domain concept because it has its own lifecycle.

Example:

```
Recurring Payment: Internet
Expected Amount: $120,000
Frequency: Monthly
Next Due Date: 2026-06-15
Suggested Category: Utilities
Suggested Account: Bancolombia
```

The system could later generate alerts such as:

```
Internet payment is due in 3 days.
```

---

# Domain v1 Summary

* User
* Family
* FamilyMember
* Account
* Category
* Transaction
* Budget
* RecurringPayment

---

# Out of Scope for MVP

The following concepts are important but will be handled in a future version:

* Debt
* Loan
* Receivable
* Payable
* Bank Integration
* Advanced Reports
* Financial Goals
* AI Suggestions

---

# MVP Domain Scope

The first version should focus on:

* User registration.
* Family creation.
* Inviting family members.
* Creating real accounts.
* Creating categories.
* Registering income.
* Registering expenses.
* Registering transfers.
* Managing monthly budgets.
* Managing recurring payments.
* Showing simple reports.
