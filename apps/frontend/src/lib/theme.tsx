import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export const THEME_STORAGE_KEY = "ikis.theme";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = Exclude<ThemePreference, "system">;

const LIGHT_THEME_COLOR = "#FBFAF7";
const DARK_THEME_COLOR = "#131226";

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function getStoredThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(value) ? value : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark = false): ResolvedTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }

  return preference;
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolvedTheme = resolveTheme(preference, systemPrefersDark());
  const root = document.documentElement;

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.style.colorScheme = resolvedTheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    resolvedTheme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR,
  );

  return resolvedTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredThemePreference);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(preference, systemPrefersDark()));

  useEffect(() => {
    setResolvedTheme(applyTheme(preference));

    if (preference !== "system" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setResolvedTheme(applyTheme("system"));
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [preference]);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    } catch {
      // The theme still works when browser storage is unavailable.
    }
    setPreferenceState(nextPreference);
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
