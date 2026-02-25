"use client";

import { useWeeklyDigest, type WeeklyDigest } from "@/lib/hooks/use-ai";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Loader2,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  ListTodo,
  BookOpen,
  FolderKanban,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

export function WeeklyDigestWidget() {
  const digest = useWeeklyDigest();
  const [data, setData] = useState<WeeklyDigest | null>(null);

  const handleGenerate = async () => {
    try {
      const result = await digest.mutateAsync();
      setData(result);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--accent-500)]" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">AI Weekly Digest</h3>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          disabled={digest.isPending}
        >
          {digest.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : data ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {data ? "Refresh" : "Generate"}
        </Button>
      </div>

      {digest.isPending && (
        <div className="text-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-500)] mx-auto mb-2" />
          <p className="text-sm text-[var(--text-tertiary)]">
            Analyzing your week...
          </p>
        </div>
      )}

      {digest.isError && !data && (
        <p className="text-xs text-red-500 text-center py-4">
          {digest.error?.message || "Failed to generate digest."}
        </p>
      )}

      {data && !digest.isPending && (
        <div className="space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { icon: CheckCircle2, label: "Done", value: data.stats.tasksCompleted, color: "#22c55e" },
              { icon: ListTodo, label: "Created", value: data.stats.tasksCreated, color: "#f59e0b" },
              { icon: Lightbulb, label: "Ideas", value: data.stats.ideasCreated, color: "#8b5cf6" },
              { icon: BookOpen, label: "Articles", value: data.stats.articlesWritten, color: "#3b82f6" },
              { icon: FolderKanban, label: "Active", value: data.stats.activeProjects, color: "#5B7FD6" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="text-center">
                <Icon className="w-4 h-4 mx-auto mb-0.5" style={{ color }} />
                <p className="text-lg font-bold" style={{ color }}>{value}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{label}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">
            {data.summary}
          </p>

          {/* Highlights */}
          {data.highlights.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Highlights
              </h4>
              <ul className="space-y-1">
                {data.highlights.map((h, i) => (
                  <li key={i} className="text-xs text-[var(--text-primary)] flex items-start gap-2">
                    <span className="text-[var(--accent-500)] flex-shrink-0 mt-0.5">-</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {data.suggestions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" />
                Suggestions for Next Week
              </h4>
              <ul className="space-y-1">
                {data.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-[var(--text-primary)] flex items-start gap-2">
                    <span className="text-[var(--accent-500)] flex-shrink-0 mt-0.5">-</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-[var(--text-tertiary)] text-right">
            Generated {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>
      )}

      {!data && !digest.isPending && !digest.isError && (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
          Click Generate to get an AI-powered summary of your week.
        </p>
      )}
    </Card>
  );
}
