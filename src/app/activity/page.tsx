"use client";

import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Activity, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const sourceFilters = [
  { label: "All", value: "all" },
  { label: "Local", value: "local" },
  { label: "Asana", value: "asana" },
  { label: "Gmail", value: "gmail" },
  { label: "Calendar", value: "calendar" },
  { label: "GitHub", value: "github" },
];

export default function ActivityPage() {
  const [source, setSource] = useState("all");

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
      <Card>
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Activity will appear here as you create projects, tasks, ideas, and connect integrations."
        />
      </Card>
    </PageShell>
  );
}
