"use client";
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (stored === "dark" || stored === "light") setTheme(stored);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 left-4 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow hover:bg-gray-300 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      type="button"
    >
      <span className="sr-only">Toggle theme</span>
      {theme === "dark" ? (
        <FaSun className="w-6 h-6" />
      ) : (
        <FaMoon className="w-6 h-6" />
      )}
    </button>
  );
} 