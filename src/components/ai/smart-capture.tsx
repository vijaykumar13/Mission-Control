"use client";

import { useState, useRef } from "react";
import { useSmartCapture } from "@/lib/hooks/use-search";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  ListTodo,
  Lightbulb,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const TYPE_CONFIG = {
  task: { icon: ListTodo, label: "Task", color: "#f59e0b" },
  idea: { icon: Lightbulb, label: "Idea", color: "#8b5cf6" },
  kb_article: { icon: BookOpen, label: "Note", color: "#22c55e" },
} as const;

const HINTS = [
  '"task: fix login bug by friday"',
  '"idea: mobile app for tracking"',
  '"note: API design patterns"',
  '"implement dark mode"',
];

export function SmartCapture() {
  const [input, setInput] = useState("");
  const [lastResult, setLastResult] = useState<{
    type: string;
    title: string;
    href: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const capture = useSmartCapture();
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || capture.isPending) return;

    try {
      const result = await capture.mutateAsync({ input: input.trim() });
      setInput("");
      setLastResult(result);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      queryClient.invalidateQueries({ queryKey: ["kb-articles"] });
      queryClient.invalidateQueries({ queryKey: ["activities-recent"] });

      // Clear success message after 4 seconds
      setTimeout(() => setLastResult(null), 4000);
    } catch {
      // Error handled by mutation state
    }
  };

  // Detect type in real-time for preview
  const detectedType = getDetectedType(input);
  const typeConfig = detectedType ? TYPE_CONFIG[detectedType] : null;

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="relative max-w-xl">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
          {capture.isPending ? (
            <Loader2 className="w-4 h-4 text-[var(--accent-500)] animate-spin" />
          ) : typeConfig ? (
            <typeConfig.icon className="w-4 h-4" style={{ color: typeConfig.color }} />
          ) : (
            <Sparkles className="w-4 h-4 text-[var(--text-tertiary)]" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Quick capture... task, idea, or note"
          className="w-full h-11 pl-10 pr-24 text-sm rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] transition-shadow"
        />
        {input.trim() && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {typeConfig && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${typeConfig.color}15`,
                  color: typeConfig.color,
                }}
              >
                {typeConfig.label}
              </span>
            )}
            <button
              type="submit"
              disabled={capture.isPending}
              className="p-1.5 rounded-[var(--radius-md)] bg-[var(--accent-500)] text-white hover:bg-[var(--accent-600)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </form>

      {/* Success feedback */}
      {lastResult && (
        <button
          onClick={() => {
            router.push(lastResult.href);
            setLastResult(null);
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full bg-[var(--accent-50)] text-[var(--accent-600)] hover:bg-[var(--accent-100)] transition-colors cursor-pointer animate-in fade-in slide-in-from-bottom-1 duration-200"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Created {lastResult.type}: {lastResult.title}
          <ArrowRight className="w-3 h-3" />
        </button>
      )}

      {/* Error feedback */}
      {capture.isError && (
        <p className="text-xs text-red-500 px-1">
          {capture.error?.message || "Failed to create. Try again."}
        </p>
      )}

      {/* Hints - only show when empty and not just created */}
      {!input && !lastResult && (
        <p className="text-[10px] text-[var(--text-tertiary)] px-1">
          Try: {HINTS[Math.floor(Date.now() / 10000) % HINTS.length]}
        </p>
      )}
    </div>
  );
}

/** Quick detection of type from input prefix (client-side preview only) */
function getDetectedType(input: string): "task" | "idea" | "kb_article" | null {
  const t = input.trim().toLowerCase();
  if (!t) return null;
  if (/^(task|todo|fix|bug|implement|build|add|create|update|refactor|test)\s*[:\-–—]/i.test(t)) return "task";
  if (/^(note|kb|article|doc|document|write up|reference)\s*[:\-–—]/i.test(t)) return "kb_article";
  if (/^(idea|what if|how about|maybe|consider|explore)\s*[:\-–—]?/i.test(t)) return "idea";
  return null;
}
