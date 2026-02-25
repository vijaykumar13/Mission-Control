"use client";

import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  FolderKanban,
  ListTodo,
  Lightbulb,
  BookOpen,
  Link2,
  Plus,
  CheckCircle2,
  Pencil,
  ArrowRight,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface ActivityItem {
  id: string;
  entityId: string | null;
  entityType: "project" | "task" | "idea" | "kb_article" | "integration" | null;
  action: "created" | "updated" | "completed" | "promoted" | "synced" | "deleted";
  title: string;
  metadata: string | null;
  source: "local" | "asana" | "gmail" | "calendar" | "github";
  createdAt: string;
}

const sourceFilters = [
  { label: "All", value: "all" },
  { label: "Local", value: "local" },
  { label: "Asana", value: "asana" },
  { label: "Gmail", value: "gmail" },
  { label: "Calendar", value: "calendar" },
  { label: "GitHub", value: "github" },
];

const ACTION_ICONS: Record<string, React.ElementType> = {
  created: Plus,
  updated: Pencil,
  completed: CheckCircle2,
  promoted: ArrowRight,
  synced: RefreshCw,
  deleted: Trash2,
};

const ACTION_COLORS: Record<string, string> = {
  created: "#22c55e",
  updated: "#f59e0b",
  completed: "#5B7FD6",
  promoted: "#8b5cf6",
  synced: "#3b82f6",
  deleted: "#ef4444",
};

const ENTITY_ICONS: Record<string, React.ElementType> = {
  project: FolderKanban,
  task: ListTodo,
  idea: Lightbulb,
  kb_article: BookOpen,
  integration: Link2,
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function ActivityPage() {
  const [source, setSource] = useState("all");

  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities", source],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (source !== "all") params.set("source", source);
      const res = await fetch(`/api/activities?${params}`);
      const json = await res.json();
      return json.data as ActivityItem[];
    },
  });

  // Group activities by date
  const grouped = (activities || []).reduce<Record<string, ActivityItem[]>>((acc, item) => {
    const dateKey = formatDate(item.createdAt);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  return (
    <PageShell
      title="Activity"
      description="Timeline of all activity across your workspace"
    >
      {/* Source Filters */}
      <div className="flex items-center gap-1 flex-wrap">
        {sourceFilters.map((s) => (
          <button
            key={s.value}
            onClick={() => setSource(s.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
              source === s.value
                ? "bg-[var(--accent-50)] text-[var(--accent-500)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      {isLoading ? (
        <Card>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : activities && activities.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 px-1">
                {dateLabel}
              </h3>
              <Card>
                <div className="space-y-0.5">
                  {items.map((item, index) => {
                    const ActionIcon = ACTION_ICONS[item.action] || Activity;
                    const EntityIcon = item.entityType ? ENTITY_ICONS[item.entityType] : null;
                    const color = ACTION_COLORS[item.action] || "#94a3b8";

                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 px-2 py-2.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        {/* Action icon */}
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <ActionIcon className="w-3.5 h-3.5" style={{ color }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-primary)] line-clamp-1">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[var(--text-tertiary)]">
                              {formatTime(item.createdAt)}
                            </span>
                            {item.source !== "local" && (
                              <Badge size="sm" variant="default">{item.source}</Badge>
                            )}
                            {EntityIcon && (
                              <EntityIcon className="w-3 h-3 text-[var(--text-tertiary)]" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Activity will appear here as you create projects, tasks, ideas, and connect integrations."
          />
        </Card>
      )}
    </PageShell>
  );
}
