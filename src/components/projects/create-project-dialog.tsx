"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useCreateProject } from "@/lib/hooks/use-projects";
import type { CreateProjectInput } from "@/lib/validations";

const COLORS = [
  "#5B7FD6", "#ef4444", "#f59e0b", "#22c55e",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateProjectDialog({ open, onClose }: CreateProjectDialogProps) {
  const createProject = useCreateProject();
  const [form, setForm] = useState<CreateProjectInput>({
    title: "",
    description: "",
    status: "active",
    priority: "medium",
    color: "#5B7FD6",
  });

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      await createProject.mutateAsync(form);
      setForm({ title: "", description: "", status: "active", priority: "medium", color: "#5B7FD6" });
      onClose();
    } catch {
      // Error handling via mutation state
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-[var(--surface-card)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">New Project</h2>
          <button onClick={onClose} className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Mission Control App"
              autoFocus
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
              Description
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What is this project about?"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
              Priority
            </label>
            <div className="flex gap-2">
              {(["low", "medium", "high", "critical"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-colors cursor-pointer ${
                    form.priority === p
                      ? "bg-[var(--accent-50)] text-[var(--accent-500)] ring-1 ring-[var(--accent-500)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
              Color
            </label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${
                    form.color === c ? "ring-2 ring-offset-2 ring-[var(--accent-500)] scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {createProject.isError && (
            <p className="text-sm text-[var(--danger)]">
              {createProject.error.message}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!form.title.trim() || createProject.isPending}>
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
