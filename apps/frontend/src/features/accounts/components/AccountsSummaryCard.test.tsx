import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it } from "vitest";
import i18n from "@/i18n";
import type { Account } from "@/features/accounts/api";
import { AccountsSummaryCard } from "./AccountsSummaryCard";

beforeAll(() => i18n.changeLanguage("es"));

function account(id: string, name: string, balance: number): Account {
  return { id, familyId: "f1", name, type: "checking", currency: "COP", balance, archivedAt: null, createdAt: "2026-01-01" };
}

function renderCard(props: React.ComponentProps<typeof AccountsSummaryCard>) {
  return render(
    <MemoryRouter>
      <AccountsSummaryCard {...props} />
    </MemoryRouter>,
  );
}

describe("AccountsSummaryCard", () => {
  it("shows a loading state while accounts are being fetched", () => {
    renderCard({ accounts: undefined, isLoading: true });
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });

  it("shows an empty state once loaded with no accounts", () => {
    renderCard({ accounts: [], isLoading: false });
    expect(screen.getByText("Todavía no hay cuentas.")).toBeInTheDocument();
  });

  it("lists each account with its formatted balance", () => {
    renderCard({ accounts: [account("a", "Nu", 150_000), account("b", "Efectivo", 50_000)], isLoading: false });

    expect(screen.getByText("Nu")).toBeInTheDocument();
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });
});
