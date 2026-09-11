import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="group rounded-xl border border-line bg-card p-2 text-quiet transition hover:bg-hover hover:text-ink hover:scale-110"
      aria-label="Toggle theme"
    >
      <span className="flex transition duration-200 group-hover:rotate-90">
        {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
      </span>
    </button>
  );
}
