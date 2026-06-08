import { Timestamp } from 'firebase/firestore';

export type Currency = 'COP' | 'USD';
export type UserLanguage = 'en' | 'es';
export type EntityStatus = 'active' | 'inactive';
export type MemberRole = 'owner' | 'admin' | 'member';
export type MemberStatus = 'active' | 'inactive' | 'removed';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
export type AccountType = 'savings' | 'cash' | 'digital_wallet' | 'credit_card';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'active' | 'cancelled';
export type TransactionSource = 'manual' | 'recurring_payment';
export type ActivePeriodType = 'monthly' | 'yearly' | 'custom';
export type BudgetPeriodType = ActivePeriodType;
export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom';

export interface ActivePeriod {
  periodType: ActivePeriodType;
  month?: number | null;
  year?: number | null;
  customStart?: Timestamp | null;
  customEnd?: Timestamp | null;
}

export interface UserProfile {
  id: string;
  googleProviderId: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  preferredLanguage: UserLanguage;
  defaultFamilyId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  status: EntityStatus;
}

export interface Family {
  id: string;
  name: string;
  mainCurrency: Currency;
  ownerUserId: string;
  activePeriod?: ActivePeriod | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: EntityStatus;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  email: string;
  displayName: string;
  role: MemberRole;
  joinedAt: Timestamp;
  status: MemberStatus;
}

export interface Invitation {
  id: string;
  familyId: string;
  email: string;
  role: Exclude<MemberRole, 'owner'>;
  invitedByUserId: string;
  status: InvitationStatus;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  acceptedAt?: Timestamp | null;
}

export interface Account {
  id: string;
  familyId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  currency: Currency;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: EntityStatus;
}

export interface Category {
  id: string;
  familyId: string;
  name: string;
  normalizedName: string;
  color?: string;
  icon?: string;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: EntityStatus;
}

export interface Transaction {
  id: string;
  familyId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  accountId?: string;
  sourceAccountId?: string;
  destinationAccountId?: string;
  categoryId?: string;
  description?: string;
  transactionDate: Timestamp;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: TransactionStatus;
  source: TransactionSource;
  recurringPaymentId?: string | null;
}

export interface Budget {
  id: string;
  familyId: string;
  name: string;
  categoryId: string;
  plannedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  periodType: BudgetPeriodType;
  month?: number;
  year?: number;
  startDate: Timestamp;
  endDate: Timestamp;
  currency: Currency;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: EntityStatus;
}

export interface RecurringPayment {
  id: string;
  familyId: string;
  name: string;
  expectedAmount: number;
  frequency: RecurringFrequency;
  nextDueDate: Timestamp;
  suggestedAccountId?: string;
  suggestedCategoryId?: string;
  currency: Currency;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: EntityStatus;
  lastPaidAt?: Timestamp | null;
}
