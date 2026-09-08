import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type ThemeContextValue = {
  theme: string;
  toggleTheme: () => void;
};

const THEME_KEY = "pingme-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme() {
  try {
    if (localStorage.getItem(THEME_KEY) === "dark") {
      return "dark";
    }
    return "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme: string) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(function () {
    const stored = getStoredTheme();
    applyTheme(stored);
    return stored;
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      return;
    }
  }, [theme]);

  function toggleTheme() {
    if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }

  const value = {
    theme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
