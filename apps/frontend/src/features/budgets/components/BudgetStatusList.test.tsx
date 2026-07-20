import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import type { BudgetStatus } from "@/features/budgets/api";
import { BudgetStatusList } from "./BudgetStatusList";

beforeAll(() => i18n.changeLanguage("es"));

function budget(id: string, categoryId: string, amountLimit: number, spent: number): BudgetStatus {
  return { id, categoryId, period: "2026-07", periodEnd: "2026-07-31", amountLimit, spent };
}

function renderList(props: React.ComponentProps<typeof BudgetStatusList>) {
  return render(
    <MemoryRouter>
      <BudgetStatusList {...props} />
    </MemoryRouter>,
  );
}

describe("BudgetStatusList", () => {
  it("shows a loading state while budget status is being fetched", () => {
    renderList({ budgetStatus: undefined, isLoading: true, categoryName: (id) => id });
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });

  it("shows an empty state once loaded with no budgets", () => {
    renderList({ budgetStatus: [], isLoading: false, categoryName: (id) => id });
    expect(screen.getByText("Todavía no hay presupuestos para este mes.")).toBeInTheDocument();
  });

  it("orders budgets by execution and resolves category names through the given lookup", () => {
    const categoryName = vi.fn((id: string) => `Category ${id}`);
    renderList({
      budgetStatus: [budget("half", "c1", 100, 50), budget("quarter", "c2", 100, 25)],
      isLoading: false,
      categoryName,
    });

    const items = screen.getAllByText(/^Category /).map((el) => el.textContent);
    expect(items).toEqual(["Category c2", "Category c1"]);
    expect(categoryName).toHaveBeenCalledWith("c1");
    expect(categoryName).toHaveBeenCalledWith("c2");
  });

  it("caps the displayed percentage at 100 when spending exceeds the limit", () => {
    renderList({ budgetStatus: [budget("over", "c1", 100, 250)], isLoading: false, categoryName: (id) => id });
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
