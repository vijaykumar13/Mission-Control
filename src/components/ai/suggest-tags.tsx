"use client";

import { useSuggestTags, type TagSuggestion } from "@/lib/hooks/use-search";
import { useAssignTag } from "@/lib/hooks/use-tags";
import { Sparkles, Plus, Loader2, Check } from "lucide-react";
import { useState } from "react";

interface SuggestTagsProps {
  content: string;
  entityId: string;
  entityType: "project" | "idea" | "kb_article";
}

export function SuggestTags({ content, entityId, entityType }: SuggestTagsProps) {
  const { data: suggestions, isLoading } = useSuggestTags(content, {
    entityId,
    entityType,
    enabled: content.length >= 5,
  });
  const assignTag = useAssignTag();
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const handleApply = async (suggestion: TagSuggestion) => {
    try {
      await assignTag.mutateAsync({
        tagId: suggestion.tagId,
        entityId,
        entityType,
      });
      setApplied((prev) => new Set([...prev, suggestion.tagId]));
    } catch {
      // handled by mutation state
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Analyzing for tag suggestions...</span>
      </div>
    );
  }

  if (!suggestions?.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[var(--accent-500)]" />
        <span className="text-xs font-medium text-[var(--text-secondary)]">Suggested Tags</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => {
          const isApplied = applied.has(s.tagId);
          return (
            <button
              key={s.tagId}
              onClick={() => !isApplied && handleApply(s)}
              disabled={isApplied || assignTag.isPending}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isApplied
                  ? "bg-[var(--accent-50)] text-[var(--accent-600)] opacity-60"
                  : "bg-[var(--gray-100)] text-[var(--text-secondary)] hover:bg-[var(--accent-50)] hover:text-[var(--accent-600)]"
              }`}
              title={s.reason}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
              {isApplied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
