"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  ListTodo,
  Lightbulb,
  BookOpen,
  Loader2,
  Plus,
  Zap,
  Calendar,
  AlertTriangle,
  ArrowDown,
} from "lucide-react";
import { useAppStore } from "@/lib/stores/app-store";
import { useCreateTask } from "@/lib/hooks/use-tasks";
import { useCreateIdea } from "@/lib/hooks/use-ideas";
import { useCreateKBArticle } from "@/lib/hooks/use-kb";
import { useProjects } from "@/lib/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/stores/toast-store";
import { parseCapture, type CaptureResult } from "@/lib/ai/smart-capture";

type CaptureType = "task" | "idea" | "article";

const TYPES: { value: CaptureType; label: string; icon: React.ElementType; color: string }[] = [
  { value: "task", label: "Task", icon: ListTodo, color: "#f59e0b" },
  { value: "idea", label: "Idea", icon: Lightbulb, color: "#8b5cf6" },
  { value: "article", label: "Article", icon: BookOpen, color: "#22c55e" },
];

export function QuickCapture() {
  const { ui, setQuickCaptureOpen } = useAppStore();
  const [type, setType] = useState<CaptureType>("task");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskDueDate, setTaskDueDate] = useState("");

  const { data: projects } = useProjects();
  const createTask = useCreateTask();
  const createIdea = useCreateIdea();
  const createArticle = useCreateKBArticle();

  // Smart capture: parse title in real-time
  const parsed: CaptureResult | null = useMemo(() => {
    if (!title.trim()) return null;
    return parseCapture(title);
  }, [title]);

  // Auto-switch type based on smart capture detection
  useEffect(() => {
    if (!parsed) return;
    const typeMap: Record<string, CaptureType> = {
      task: "task",
      idea: "idea",
      kb_article: "article",
    };
    const detected = typeMap[parsed.type];
    if (detected && detected !== type) {
      setType(detected);
    }
    if (parsed.priority) {
      setTaskPriority(parsed.priority);
    }
    if (parsed.dueDate) {
      setTaskDueDate(parsed.dueDate);
    }
  }, [parsed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global shortcut: Cmd+Shift+Space or just the Plus button in header
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "Space") {
        e.preventDefault();
        setQuickCaptureOpen(!ui.quickCaptureOpen);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [ui.quickCaptureOpen, setQuickCaptureOpen]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);

    try {
      switch (type) {
        case "task":
          if (!projectId) {
            toast.warning("Select a project", "Tasks need to be assigned to a project.");
            setIsSubmitting(false);
            return;
          }
          await createTask.mutateAsync({
            title: (parsed?.title || title).trim(),
            description: description.trim() || null,
            projectId,
            status: "todo",
            priority: taskPriority,
            dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
            sortOrder: 0,
          });
          toast.success("Task created", title.trim());
          break;
        case "idea":
          await createIdea.mutateAsync({
            title: (parsed?.title || title).trim(),
            body: description.trim() || null,
            stage: parsed?.stage || "spark",
          });
          toast.success("Idea captured", title.trim());
          break;
        case "article":
          await createArticle.mutateAsync({
            title: (parsed?.title || title).trim(),
            content: description.trim() || "",
            pinned: false,
          });
          toast.success("Article created", title.trim());
          break;
      }

      // Reset form
      setTitle("");
      setDescription("");
      setProjectId("");
      setTaskPriority("medium");
      setTaskDueDate("");
      setQuickCaptureOpen(false);
    } catch (err) {
      toast.error("Failed to create", (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }, [type, title, description, projectId, createTask, createIdea, createArticle, setQuickCaptureOpen]);

  return (
    <Dialog.Root
      open={ui.quickCaptureOpen}
      onOpenChange={(open) => {
        setQuickCaptureOpen(open);
        if (!open) {
          setTitle("");
          setDescription("");
          setProjectId("");
          setTaskPriority("medium");
          setTaskDueDate("");
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-md z-50">
          <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
              <Dialog.Title className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Quick Capture
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="p-4 space-y-4">
              {/* Type Selector */}
              <div className="flex gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium cursor-pointer transition-colors ${
                      type === t.value
                        ? "text-white"
                        : "text-[var(--text-secondary)] bg-[var(--gray-100)] hover:bg-[var(--surface-hover)]"
                    }`}
                    style={
                      type === t.value
                        ? { backgroundColor: t.color }
                        : undefined
                    }
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === "task"
                    ? "What needs to be done?"
                    : type === "idea"
                    ? "What's the idea?"
                    : "Article title"
                }
                autoFocus
                className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />

              {/* Smart Capture Badges */}
              {parsed && title.trim() && (parsed.priority || parsed.dueDate) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                    <Zap className="w-3 h-3 text-[var(--accent-500)]" />
                    Detected:
                  </div>
                  {parsed.priority && (
                    <Badge
                      size="sm"
                      variant={
                        parsed.priority === "high" ? "danger"
                          : parsed.priority === "low" ? "default"
                          : "warning"
                      }
                    >
                      {parsed.priority === "high" && <AlertTriangle className="w-3 h-3" />}
                      {parsed.priority === "low" && <ArrowDown className="w-3 h-3" />}
                      {parsed.priority} priority
                    </Badge>
                  )}
                  {parsed.dueDate && (
                    <Badge size="sm" variant="info">
                      <Calendar className="w-3 h-3" />
                      Due {parsed.dueDate}
                    </Badge>
                  )}
                </div>
              )}

              {/* Project selector (for tasks only) */}
              {type === "task" && (
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] cursor-pointer"
                >
                  <option value="">Select project...</option>
                  {projects?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              )}

              {/* Description (optional) */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === "article"
                    ? "Start writing content (optional)..."
                    : "Add a note (optional)..."
                }
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] resize-none"
              />

              {/* Submit */}
              <div className="flex justify-end gap-2">
                <Dialog.Close asChild>
                  <Button variant="ghost" size="sm">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!title.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Create {TYPES.find((t) => t.value === type)?.label}
                </Button>
              </div>
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-[var(--border-default)] bg-[var(--gray-50)]">
              <p className="text-[10px] text-[var(--text-tertiary)]">
                Tip: Press Cmd+Shift+Space to open Quick Capture from anywhere
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
