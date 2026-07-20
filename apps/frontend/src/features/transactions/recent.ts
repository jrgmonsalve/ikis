import type { Transaction } from "./api";

export function selectRecentTransactions(transactions: Transaction[], limit = 3): Transaction[] {
  return [...transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}
