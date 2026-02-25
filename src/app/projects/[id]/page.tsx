"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ListTodo,
  Clock,
  MoreHorizontal,
  Plus,
  CheckCircle2,
  Circle,
  Timer,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { useProject } from "@/lib/hooks/use-projects";
import { useTasks, useCreateTask, useUpdateTask } from "@/lib/hooks/use-tasks";
import { FindSimilar } from "@/components/ai/find-similar";
import { SuggestTags } from "@/components/ai/suggest-tags";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: tasks, isLoading: tasksLoading } = useTasks(id);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await createTask.mutateAsync({
        projectId: id,
        title: newTaskTitle.trim(),
        status: "todo",
        sortOrder: (tasks?.length || 0) + 1,
      });
      setNewTaskTitle("");
    } catch {
      // handled by mutation state
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    await updateTask.mutateAsync({ id: taskId, status: newStatus });
  };

  if (projectLoading) {
    return (
      <PageShell title="Loading..." description="">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Card>
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-3/4" />
            </Card>
          </div>
          <div>
            <Card>
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-6 w-16 mb-2" />
              <Skeleton className="h-6 w-20" />
            </Card>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!project) {
    return (
      <PageShell title="Project Not Found" description="">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-500)] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
      </PageShell>
    );
  }

  const doneTasks = tasks?.filter((t) => t.status === "done").length || 0;
  const totalTasks = tasks?.length || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <PageShell
      title={project.title}
      description={project.description || undefined}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Timer className="w-4 h-4" />
            Start Timer
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      }
    >
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Link>

      {/* Project Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column - Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-[var(--text-secondary)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Tasks
                </h3>
                {totalTasks > 0 && (
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {doneTasks}/{totalTasks}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddTask(!showAddTask)}
              >
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </div>

            {/* Add task form */}
            {showAddTask && (
              <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  autoFocus
                  className="flex-1 h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                />
                <Button type="submit" size="sm" disabled={!newTaskTitle.trim() || createTask.isPending}>
                  {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </Button>
              </form>
            )}

            {/* Progress bar */}
            {totalTasks > 0 && (
              <div className="mb-4">
                <div className="h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: project.color,
                    }}
                  />
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{progress}% complete</p>
              </div>
            )}

            {/* Task list */}
            {tasksLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-1">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--surface-hover)] group transition-colors"
                  >
                    <button
                      onClick={() => toggleTaskStatus(task.id, task.status)}
                      className="flex-shrink-0 cursor-pointer"
                    >
                      {task.status === "done" ? (
                        <CheckCircle2
                          className="w-5 h-5"
                          style={{ color: project.color }}
                        />
                      ) : (
                        <Circle className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]" />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        task.status === "done"
                          ? "line-through text-[var(--text-tertiary)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.priority && (
                      <Badge
                        size="sm"
                        variant={
                          task.priority === "high" ? "danger"
                            : task.priority === "medium" ? "warning"
                            : "default"
                        }
                      >
                        {task.priority}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ListTodo}
                title="No tasks yet"
                description="Break this project into tasks to track progress."
                action={{
                  label: "Add First Task",
                  onClick: () => setShowAddTask(true),
                }}
              />
            )}
          </Card>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-4">
          {/* Project Info */}
          <Card>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Status</span>
                <Badge
                  variant={
                    project.status === "active" ? "success"
                      : project.status === "paused" ? "warning"
                      : project.status === "completed" ? "info"
                      : "default"
                  }
                >
                  {project.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Priority</span>
                <Badge
                  variant={
                    project.priority === "high" || project.priority === "critical" ? "danger"
                      : project.priority === "medium" ? "warning"
                      : "default"
                  }
                >
                  {project.priority || "—"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Created</span>
                <span className="text-xs text-[var(--text-primary)]">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Color</span>
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
              </div>
            </div>
          </Card>

          {/* Time Tracked */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Time Tracked
              </h3>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">0h 0m</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Start the timer to track time
            </p>
          </Card>

          {/* AI Tag Suggestions */}
          {project.title && (
            <Card>
              <SuggestTags
                content={[project.title, project.description].filter(Boolean).join(" ")}
                entityId={id}
                entityType="project"
              />
            </Card>
          )}

          {/* Find Similar */}
          <FindSimilar entityId={id} entityType="project" />
        </div>
      </div>
    </PageShell>
  );
}
