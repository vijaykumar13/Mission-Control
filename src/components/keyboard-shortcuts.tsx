"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/stores/app-store";

/**
 * Global keyboard shortcuts:
 * - Cmd/Ctrl + K: Command palette (handled in CommandPalette)
 * - Cmd/Ctrl + /: Toggle sidebar
 * - G then D: Go to Dashboard
 * - G then P: Go to Projects
 * - G then I: Go to Ideas
 * - G then B: Go to Knowledge Base
 * - G then A: Go to Activity
 * - G then N: Go to Analytics
 * - G then S: Go to Settings
 * - Shift + D: Toggle dark mode
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const { toggleSidebar, setTheme, ui } = useAppStore();

  useEffect(() => {
    let gPressed = false;
    let gTimeout: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      // Cmd/Ctrl + / — Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Shift + D — Toggle dark mode
      if (e.shiftKey && e.key === "D") {
        e.preventDefault();
        setTheme(ui.theme === "dark" ? "light" : "dark");
        return;
      }

      // G-key navigation (two-key combo)
      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        if (!gPressed) {
          gPressed = true;
          gTimeout = setTimeout(() => { gPressed = false; }, 500);
          return;
        }
      }

      if (gPressed) {
        gPressed = false;
        clearTimeout(gTimeout);

        const routes: Record<string, string> = {
          d: "/",
          p: "/projects",
          i: "/ideas",
          b: "/kb",
          a: "/activity",
          n: "/analytics",
          s: "/settings",
        };

        const route = routes[e.key.toLowerCase()];
        if (route) {
          e.preventDefault();
          router.push(route);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(gTimeout);
    };
  }, [router, toggleSidebar, setTheme, ui.theme]);

  return null;
}
