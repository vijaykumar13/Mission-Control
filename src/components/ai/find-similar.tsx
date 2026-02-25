"use client";

import { useFindSimilar, type SearchResult } from "@/lib/hooks/use-search";
import { Card } from "@/components/ui/card";
import { Sparkles, FolderKanban, ListTodo, Lightbulb, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";

const ENTITY_ICONS: Record<string, React.ElementType> = {
  project: FolderKanban,
  task: ListTodo,
  idea: Lightbulb,
  kb_article: BookOpen,
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  project: "Project",
  task: "Task",
  idea: "Idea",
  kb_article: "Article",
};

export function FindSimilar({
  entityId,
  entityType,
}: {
  entityId: string;
  entityType: "project" | "task" | "idea" | "kb_article";
}) {
  const { data: results, isLoading, error } = useFindSimilar(entityId, entityType);

  if (error || (!isLoading && (!results || results.length === 0))) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[var(--accent-500)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Similar Items</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--text-tertiary)]" />
        </div>
      ) : (
        <div className="space-y-1">
          {results!.map((result: SearchResult) => {
            const Icon = ENTITY_ICONS[result.entityType] || Sparkles;
            return (
              <Link
                key={`${result.entityType}-${result.entityId}`}
                href={result.href}
                className="flex items-center gap-3 px-2 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <Icon className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{result.title}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    {ENTITY_TYPE_LABELS[result.entityType]} &middot; {Math.round(result.score * 100)}% match
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
