"use client";

import { Search, Plus, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/stores/app-store";
import { TimerWidget } from "@/components/time-tracking/timer-widget";

export function Header() {
  const { setCommandPaletteOpen, setQuickCaptureOpen } = useAppStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <header className="h-[var(--header-height)] bg-[var(--surface-card)] border-b border-[var(--border-default)] flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search — opens command palette with semantic search */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="relative w-full cursor-pointer"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <div className="w-full h-9 pl-9 pr-3 text-sm rounded-[var(--radius-md)] bg-[var(--gray-100)] border border-transparent text-left text-[var(--text-tertiary)] flex items-center">
            Search everything... (Cmd+K)
          </div>
        </button>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Timer */}
        <TimerWidget />

        {/* Quick capture */}
        <button
          onClick={() => setQuickCaptureOpen(true)}
          className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] cursor-pointer"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
