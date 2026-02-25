"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { LayoutDashboard, FolderKanban, Lightbulb, BookOpen, BarChart3 } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/kb", label: "KB", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface-card)] border-t border-[var(--border-default)] flex items-center justify-around h-16 px-2 safe-area-bottom">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 py-1 px-3 rounded-[var(--radius-md)] text-xs font-medium",
              isActive ? "text-[var(--accent-500)]" : "text-[var(--text-tertiary)]"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
