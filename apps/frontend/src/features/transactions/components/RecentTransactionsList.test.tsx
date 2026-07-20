import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it } from "vitest";
import i18n from "@/i18n";
import type { Transaction } from "@/features/transactions/api";
import { RecentTransactionsList } from "./RecentTransactionsList";

beforeAll(() => i18n.changeLanguage("es"));

function transaction(overrides: Partial<Transaction> & { id: string; createdAt: string }): Transaction {
  return {
    familyId: "f1",
    accountId: "acc1",
    categoryId: null,
    createdByUserId: "u1",
    amount: 1000,
    description: null,
    occurredAt: overrides.createdAt,
    updatedAt: overrides.createdAt,
    deletedAt: null,
    ...overrides,
  };
}

function renderList(props: React.ComponentProps<typeof RecentTransactionsList>) {
  return render(
    <MemoryRouter>
      <RecentTransactionsList {...props} />
    </MemoryRouter>,
  );
}

describe("RecentTransactionsList", () => {
  it("shows a loading state while transactions are being fetched", () => {
    renderList({ transactions: undefined, isLoading: true, categoryName: (id) => id });
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });

  it("shows an empty state once loaded with no transactions", () => {
    renderList({ transactions: [], isLoading: false, categoryName: (id) => id });
    expect(screen.getByText("Todavía no hay transacciones.")).toBeInTheDocument();
  });

  it("shows only the 3 most recent transactions, most recent first", () => {
    const transactions = Array.from({ length: 5 }, (_, index) =>
      transaction({ id: `t${index}`, createdAt: `2026-01-0${index + 1}`, description: `Item ${index}` }),
    );

    renderList({ transactions, isLoading: false, categoryName: (id) => id });

    expect(screen.getByText("Item 4")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
  });

  it("falls back to the category name when there is no description", () => {
    renderList({
      transactions: [transaction({ id: "t1", createdAt: "2026-01-01", categoryId: "cat1", description: null })],
      isLoading: false,
      categoryName: (id) => `Category ${id}`,
    });

    expect(screen.getByText("Category cat1")).toBeInTheDocument();
  });
});
