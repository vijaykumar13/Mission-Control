"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Plus, LayoutGrid, List, Loader2 } from "lucide-react";
import { useState } from "react";
import { STAGE_COLORS, type IdeaStage } from "@/lib/utils/constants";
import { useIdeas, useCreateIdea, useUpdateIdea } from "@/lib/hooks/use-ideas";

const stages: { label: string; value: IdeaStage; color: string }[] = [
  { label: "Spark", value: "spark", color: STAGE_COLORS.spark },
  { label: "Exploring", value: "exploring", color: STAGE_COLORS.exploring },
  { label: "Validating", value: "validating", color: STAGE_COLORS.validating },
  { label: "Ready", value: "ready", color: STAGE_COLORS.ready },
];

export default function IdeasPage() {
  const [view, setView] = useState<"board" | "list">("board");
  const { data: ideas, isLoading } = useIdeas();
  const createIdea = useCreateIdea();
  const updateIdea = useUpdateIdea();
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [addingToStage, setAddingToStage] = useState<IdeaStage | null>(null);

  const ideasByStage = (stage: IdeaStage) =>
    ideas?.filter((i) => i.stage === stage) || [];

  const handleAddIdea = async (stage: IdeaStage) => {
    if (!newIdeaTitle.trim()) return;
    try {
      await createIdea.mutateAsync({
        title: newIdeaTitle.trim(),
        stage,
      });
      setNewIdeaTitle("");
      setAddingToStage(null);
    } catch {
      // handled by mutation state
    }
  };

  const handleMoveIdea = async (ideaId: string, newStage: IdeaStage) => {
    await updateIdea.mutateAsync({ id: ideaId, stage: newStage });
  };

  return (
    <PageShell
      title="Ideas"
      description="Capture and develop your ideas"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[var(--border-default)] rounded-[var(--radius-md)] overflow-hidden">
            <button
              onClick={() => setView("board")}
              className={`p-1.5 cursor-pointer ${view === "board" ? "bg-[var(--accent-50)] text-[var(--accent-500)]" : "text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)]"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 cursor-pointer ${view === "list" ? "bg-[var(--accent-50)] text-[var(--accent-500)]" : "text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)]"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button size="sm" onClick={() => setAddingToStage("spark")}>
            <Plus className="w-4 h-4" />
            New Idea
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : view === "board" ? (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage) => {
            const stageIdeas = ideasByStage(stage.value);
            return (
              <div key={stage.value} className="space-y-3">
                {/* Column Header */}
                <div className="flex items-center gap-2 px-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {stage.label}
                  </h3>
                  <span className="text-xs text-[var(--text-tertiary)] ml-auto">
                    {stageIdeas.length}
                  </span>
                  <button
                    onClick={() => setAddingToStage(stage.value)}
                    className="p-0.5 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add form */}
                {addingToStage === stage.value && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddIdea(stage.value);
                    }}
                    className="space-y-2"
                  >
                    <input
                      type="text"
                      value={newIdeaTitle}
                      onChange={(e) => setNewIdeaTitle(e.target.value)}
                      placeholder="Idea title..."
                      autoFocus
                      onBlur={() => {
                        if (!newIdeaTitle.trim()) setAddingToStage(null);
                      }}
                      className="w-full h-8 px-2.5 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                    />
                    <div className="flex gap-1.5">
                      <Button type="submit" size="sm" disabled={!newIdeaTitle.trim() || createIdea.isPending}>
                        {createIdea.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingToStage(null); setNewIdeaTitle(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {/* Ideas */}
                <div className="space-y-2 min-h-[100px]">
                  {stageIdeas.map((idea) => (
                    <Card key={idea.id} padding="sm" interactive>
                      <p className="text-sm font-medium text-[var(--text-primary)] mb-2 line-clamp-2">
                        {idea.title}
                      </p>
                      {idea.body && (
                        <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-2">
                          {idea.body}
                        </p>
                      )}
                      {/* Stage move buttons */}
                      <div className="flex gap-1">
                        {stages
                          .filter((s) => s.value !== stage.value)
                          .map((s) => (
                            <button
                              key={s.value}
                              onClick={() => handleMoveIdea(idea.id, s.value)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--gray-100)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--gray-200)] cursor-pointer transition-colors"
                            >
                              {s.label}
                            </button>
                          ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        ideas && ideas.length > 0 ? (
          <Card padding="none">
            <div className="divide-y divide-[var(--border-default)]">
              {ideas.map((idea) => (
                <div key={idea.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--surface-hover)] transition-colors">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STAGE_COLORS[idea.stage] }}
                  />
                  <span className="text-sm text-[var(--text-primary)] flex-1 line-clamp-1">
                    {idea.title}
                  </span>
                  <Badge size="sm" variant={
                    idea.stage === "ready" ? "success"
                      : idea.stage === "validating" ? "purple"
                      : idea.stage === "exploring" ? "info"
                      : "warning"
                  }>
                    {idea.stage}
                  </Badge>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {new Date(idea.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon={Lightbulb}
              title="No ideas yet"
              description="Capture your first idea. Ideas can be promoted to projects when they're ready."
              action={{
                label: "Add Idea",
                onClick: () => setAddingToStage("spark"),
              }}
            />
          </Card>
        )
      )}
    </PageShell>
  );
}
