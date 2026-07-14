import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  ThemeProvider,
  applyTheme,
  getStoredThemePreference,
  resolveTheme,
  useTheme,
} from "./theme";

let prefersDark = false;
const listeners = new Set<(event: MediaQueryListEvent) => void>();

const mediaQuery = {
  get matches() {
    return prefersDark;
  },
  media: "(prefers-color-scheme: dark)",
  onchange: null,
  addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) =>
    listeners.add(listener as (event: MediaQueryListEvent) => void),
  removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) =>
    listeners.delete(listener as (event: MediaQueryListEvent) => void),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
} as unknown as MediaQueryList;

function ThemeControls() {
  const { preference, resolvedTheme, setPreference } = useTheme();

  return (
    <>
      <output data-testid="preference">{preference}</output>
      <output data-testid="resolved-theme">{resolvedTheme}</output>
      <button type="button" onClick={() => setPreference("light")}>
        Light
      </button>
    </>
  );
}

function emitSystemPreference(nextPrefersDark: boolean) {
  prefersDark = nextPrefersDark;
  const event = { matches: nextPrefersDark, media: mediaQuery.media } as MediaQueryListEvent;
  listeners.forEach((listener) => listener(event));
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  document.documentElement.style.colorScheme = "";
  document.head.innerHTML = '<meta name="theme-color" content="#FBFAF7" />';
  prefersDark = false;
  listeners.clear();
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => mediaQuery) });
});

describe("theme preferences", () => {
  it("resolves system, light, and dark preferences", () => {
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("falls back to system when the stored value is invalid", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    expect(getStoredThemePreference()).toBe("system");
  });

  it("applies the resolved theme to the document and browser chrome", () => {
    prefersDark = true;
    expect(applyTheme("system")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute("content", "#131226");
  });

  it("follows the system setting until the user selects a theme", () => {
    render(
      <ThemeProvider>
        <ThemeControls />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("preference")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");

    act(() => emitSystemPreference(true));
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");

    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(screen.getByTestId("preference")).toHaveTextContent("light");

    act(() => emitSystemPreference(false));
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
  });
});
