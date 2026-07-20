import { describe, expect, it } from "vitest";
import type { Transaction } from "./api";
import { selectRecentTransactions } from "./recent";

function transaction(id: string, createdAt: string): Transaction {
  return {
    id,
    familyId: "f1",
    accountId: "acc1",
    categoryId: null,
    createdByUserId: "u1",
    amount: 1000,
    description: null,
    occurredAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  };
}

describe("selectRecentTransactions", () => {
  it("orders by most recently created first", () => {
    const transactions = [transaction("oldest", "2026-01-01"), transaction("newest", "2026-01-03"), transaction("middle", "2026-01-02")];

    expect(selectRecentTransactions(transactions).map((t) => t.id)).toEqual(["newest", "middle", "oldest"]);
  });

  it("limits the result to the given size, defaulting to 3", () => {
    const transactions = Array.from({ length: 5 }, (_, index) => transaction(`t${index}`, `2026-01-0${index + 1}`));

    expect(selectRecentTransactions(transactions)).toHaveLength(3);
    expect(selectRecentTransactions(transactions, 2)).toHaveLength(2);
  });

  it("does not mutate the input array", () => {
    const transactions = [transaction("a", "2026-01-01"), transaction("b", "2026-01-02")];
    const original = [...transactions];

    selectRecentTransactions(transactions);

    expect(transactions).toEqual(original);
  });
});
