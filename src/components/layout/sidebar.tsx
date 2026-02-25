"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  FolderKanban,
  Lightbulb,
  BookOpen,
  Activity,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/kb", label: "Knowledge Base", icon: BookOpen },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen bg-[var(--surface-sidebar)] border-r border-[var(--border-default)] fixed left-0 top-0 z-40 transition-all duration-200",
        collapsed ? "w-[var(--sidebar-collapsed)]" : "w-[var(--sidebar-width)]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-[var(--header-height)] px-4 border-b border-[var(--border-default)]">
        {!collapsed && (
          <Link href="/" className="text-base font-bold text-[var(--text-primary)] whitespace-nowrap">
            Mission Control
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] cursor-pointer"
        >
          {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--accent-50)] text-[var(--accent-500)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="py-3 px-2 border-t border-[var(--border-default)]">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-[var(--accent-50)] text-[var(--accent-500)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
