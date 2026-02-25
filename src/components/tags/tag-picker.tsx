"use client";

import { useState } from "react";
import { Tag as TagIcon, Plus, X, Loader2 } from "lucide-react";
import { useTags, useCreateTag, useEntityTags, useAssignTag, useRemoveTagAssignment } from "@/lib/hooks/use-tags";
import { toast } from "@/lib/stores/toast-store";

interface TagPickerProps {
  entityId: string;
  entityType: "project" | "idea" | "kb_article";
}

const TAG_COLORS = [
  "#5B7FD6", "#8b5cf6", "#22c55e", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#64748b",
];

export function TagPicker({ entityId, entityType }: TagPickerProps) {
  const { data: allTags } = useTags();
  const { data: entityTags, isLoading } = useEntityTags(entityId, entityType);
  const createTag = useCreateTag();
  const assignTag = useAssignTag();
  const removeTag = useRemoveTagAssignment();

  const [showPicker, setShowPicker] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const assignedTagIds = new Set(entityTags?.map((et) => et.tagId) || []);
  const availableTags = allTags?.filter((t) => !assignedTagIds.has(t.id)) || [];

  const handleAssign = async (tagId: string) => {
    try {
      await assignTag.mutateAsync({ tagId, entityId, entityType });
    } catch (err) {
      toast.error("Failed to assign tag", (err as Error).message);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    try {
      await removeTag.mutateAsync({ id: assignmentId });
    } catch (err) {
      toast.error("Failed to remove tag", (err as Error).message);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const tag = await createTag.mutateAsync({ name: newTagName.trim(), color: newTagColor });
      await assignTag.mutateAsync({ tagId: tag.id, entityId, entityType });
      setNewTagName("");
      setShowCreateForm(false);
      toast.success("Tag created and assigned");
    } catch (err) {
      toast.error("Failed to create tag", (err as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5">
        <Loader2 className="w-3 h-3 animate-spin text-[var(--text-tertiary)]" />
        <span className="text-xs text-[var(--text-tertiary)]">Loading tags...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Assigned Tags */}
      <div className="flex flex-wrap gap-1.5">
        {entityTags?.map((et) => (
          <span
            key={et.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: et.tag?.color || "#64748b" }}
          >
            {et.tag?.name || "Unknown"}
            <button
              onClick={() => handleRemove(et.id)}
              className="hover:opacity-75 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-[var(--text-tertiary)] border border-dashed border-[var(--border-default)] hover:border-[var(--accent-500)] hover:text-[var(--accent-500)] cursor-pointer transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add tag
        </button>
      </div>

      {/* Tag Picker Dropdown */}
      {showPicker && (
        <div className="border border-[var(--border-default)] rounded-[var(--radius-md)] bg-[var(--surface-card)] shadow-[var(--shadow-md)] p-2 space-y-1">
          {availableTags.length > 0 ? (
            availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  handleAssign(tag.id);
                  setShowPicker(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)] cursor-pointer text-left"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-xs text-[var(--text-primary)]">{tag.name}</span>
              </button>
            ))
          ) : (
            <p className="text-xs text-[var(--text-tertiary)] px-2 py-1">No available tags</p>
          )}

          <div className="border-t border-[var(--border-default)] pt-1 mt-1">
            {showCreateForm ? (
              <div className="space-y-2 p-1">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                  autoFocus
                  className="w-full h-7 px-2 text-xs rounded border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-500)]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateTag();
                    if (e.key === "Escape") setShowCreateForm(false);
                  }}
                />
                <div className="flex gap-1">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewTagColor(c)}
                      className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${
                        newTagColor === c ? "ring-2 ring-offset-1 ring-[var(--accent-500)] scale-110" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || createTag.isPending}
                    className="px-2 py-1 text-xs bg-[var(--accent-500)] text-white rounded cursor-pointer disabled:opacity-50"
                  >
                    {createTag.isPending ? "..." : "Create"}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)] cursor-pointer text-left"
              >
                <Plus className="w-3 h-3 text-[var(--accent-500)]" />
                <span className="text-xs text-[var(--accent-500)]">Create new tag</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
