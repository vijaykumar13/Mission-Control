"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderKanban,
  ListTodo,
  Lightbulb,
  BookOpen,
  LayoutDashboard,
  BarChart3,
  Settings,
  Activity,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/lib/stores/app-store";
import { useProjects } from "@/lib/hooks/use-projects";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useIdeas } from "@/lib/hooks/use-ideas";
import { useKBArticles } from "@/lib/hooks/use-kb";
import { useSemanticSearch, type SearchResult } from "@/lib/hooks/use-search";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  href: string;
  category: string;
  color?: string;
  score?: number;
}

const STATIC_COMMANDS: CommandItem[] = [
  { id: "nav-dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/", category: "Navigation" },
  { id: "nav-projects", label: "Projects", icon: FolderKanban, href: "/projects", category: "Navigation" },
  { id: "nav-ideas", label: "Ideas", icon: Lightbulb, href: "/ideas", category: "Navigation" },
  { id: "nav-kb", label: "Knowledge Base", icon: BookOpen, href: "/kb", category: "Navigation" },
  { id: "nav-activity", label: "Activity", icon: Activity, href: "/activity", category: "Navigation" },
  { id: "nav-analytics", label: "Analytics", icon: BarChart3, href: "/analytics", category: "Navigation" },
  { id: "nav-settings", label: "Settings", icon: Settings, href: "/settings", category: "Navigation" },
];

const ENTITY_ICONS: Record<string, React.ElementType> = {
  project: FolderKanban,
  task: ListTodo,
  idea: Lightbulb,
  kb_article: BookOpen,
};

const ENTITY_LABELS: Record<string, string> = {
  project: "Projects",
  task: "Tasks",
  idea: "Ideas",
  kb_article: "Knowledge Base",
};

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

/** Debounce hook */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function CommandPalette() {
  const router = useRouter();
  const { ui, setCommandPaletteOpen } = useAppStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebouncedValue(query, 300);

  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();
  const { data: ideas } = useIdeas();
  const { data: articles } = useKBArticles();

  // Semantic search — triggers when query is 2+ chars after debounce
  const {
    data: semanticResults,
    isFetching: isSearching,
  } = useSemanticSearch(debouncedQuery, { enabled: ui.commandPaletteOpen });

  // Build local searchable items
  const localItems = useMemo((): CommandItem[] => {
    const items: CommandItem[] = [...STATIC_COMMANDS];

    projects?.forEach((p) => {
      items.push({
        id: `project-${p.id}`,
        label: p.title,
        description: p.status,
        icon: FolderKanban,
        href: `/projects/${p.id}`,
        category: "Projects",
        color: p.color,
      });
    });

    tasks?.forEach((t) => {
      items.push({
        id: `task-${t.id}`,
        label: t.title,
        description: t.status,
        icon: ListTodo,
        href: t.projectId ? `/projects/${t.projectId}` : "/projects",
        category: "Tasks",
      });
    });

    ideas?.forEach((i) => {
      items.push({
        id: `idea-${i.id}`,
        label: i.title,
        description: i.stage,
        icon: Lightbulb,
        href: "/ideas",
        category: "Ideas",
      });
    });

    articles?.forEach((a) => {
      items.push({
        id: `kb-${a.id}`,
        label: a.title,
        icon: BookOpen,
        href: `/kb/${a.id}`,
        category: "Knowledge Base",
      });
    });

    return items;
  }, [projects, tasks, ideas, articles]);

  // Convert semantic results to CommandItems
  const aiItems = useMemo((): CommandItem[] => {
    if (!semanticResults?.length) return [];
    return semanticResults.map((r: SearchResult) => ({
      id: `ai-${r.entityType}-${r.entityId}`,
      label: r.title,
      description: `${Math.round(r.score * 100)}% match`,
      icon: ENTITY_ICONS[r.entityType] || Search,
      href: r.href,
      category: `AI Results`,
      score: r.score,
    }));
  }, [semanticResults]);

  // Combine: show AI results first if available, then fuzzy local results
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return localItems.slice(0, 15);
    }

    // Local fuzzy matches
    const localMatches = localItems.filter(
      (item) =>
        fuzzyMatch(query, item.label) ||
        (item.description && fuzzyMatch(query, item.description)) ||
        fuzzyMatch(query, item.category)
    );

    // Merge: AI results first, then local matches (deduped)
    if (aiItems.length > 0) {
      const aiEntityIds = new Set(aiItems.map((i) => i.id.replace("ai-", "")));
      const uniqueLocal = localMatches.filter((item) => {
        const key = item.id.replace(/^(project|task|idea|kb)-/, (_, type) => `${type === "kb" ? "kb_article" : type}-`);
        return !aiEntityIds.has(key);
      });
      return [...aiItems, ...uniqueLocal];
    }

    return localMatches;
  }, [query, localItems, aiItems]);

  // Group by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Flat list for keyboard nav
  const flatItems = useMemo(
    () => Object.values(groupedItems).flat(),
    [groupedItems]
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, aiItems.length]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!ui.commandPaletteOpen);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [ui.commandPaletteOpen, setCommandPaletteOpen]);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      setCommandPaletteOpen(false);
      setQuery("");
      router.push(item.href);
    },
    [setCommandPaletteOpen, router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (flatItems[selectedIndex]) {
            handleSelect(flatItems[selectedIndex]);
          }
          break;
      }
    },
    [flatItems, selectedIndex, handleSelect]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  let flatIndex = -1;

  return (
    <Dialog.Root
      open={ui.commandPaletteOpen}
      onOpenChange={(open) => {
        setCommandPaletteOpen(open);
        if (!open) setQuery("");
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onKeyDown={handleKeyDown}
        >
          <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 border-b border-[var(--border-default)]">
              {isSearching ? (
                <Loader2 className="w-5 h-5 text-[var(--accent-500)] flex-shrink-0 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
              )}
              <Dialog.Title className="sr-only">Search Everything</Dialog.Title>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search with AI or type to filter..."
                className="flex-1 h-12 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--gray-100)] border border-[var(--border-default)] rounded">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="max-h-[360px] overflow-y-auto py-2"
            >
              {flatItems.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  {isSearching ? (
                    <p className="text-sm text-[var(--text-tertiary)]">
                      Searching with AI...
                    </p>
                  ) : (
                    <p className="text-sm text-[var(--text-tertiary)]">
                      No results found for &ldquo;{query}&rdquo;
                    </p>
                  )}
                </div>
              ) : (
                Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-4 py-1.5 flex items-center gap-1.5">
                      {category === "AI Results" && (
                        <Sparkles className="w-3 h-3 text-[var(--accent-500)]" />
                      )}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        {category}
                      </span>
                    </div>
                    {items.map((item) => {
                      flatIndex++;
                      const idx = flatIndex;
                      return (
                        <button
                          key={item.id}
                          data-index={idx}
                          onClick={() => handleSelect(item)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-left cursor-pointer transition-colors ${
                            selectedIndex === idx
                              ? "bg-[var(--accent-50)] text-[var(--accent-600)]"
                              : "text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                          }`}
                        >
                          <item.icon
                            className="w-4 h-4 flex-shrink-0"
                            style={item.color ? { color: item.color } : undefined}
                          />
                          <span className="flex-1 text-sm truncate">
                            {item.label}
                          </span>
                          {item.description && (
                            <span className="text-xs text-[var(--text-tertiary)]">
                              {item.description}
                            </span>
                          )}
                          <ArrowRight className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100" />
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-default)] bg-[var(--gray-50)]">
              <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-[var(--surface-card)] border border-[var(--border-default)] rounded text-[10px]">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-[var(--surface-card)] border border-[var(--border-default)] rounded text-[10px]">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-[var(--surface-card)] border border-[var(--border-default)] rounded text-[10px]">esc</kbd>
                  Close
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-tertiary)]">
                {aiItems.length > 0 && (
                  <><Sparkles className="w-3 h-3 inline mr-1 text-[var(--accent-500)]" />AI + </>
                )}
                {flatItems.length} result{flatItems.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
