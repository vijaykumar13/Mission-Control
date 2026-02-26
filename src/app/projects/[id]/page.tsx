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
  Plus,
  CheckCircle2,
  Circle,
  Timer,
  Loader2,
  Pencil,
  X,
  Save,
  Trash2,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { use, useState } from "react";
import { useProject, useUpdateProject, useDeleteProject } from "@/lib/hooks/use-projects";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/lib/hooks/use-tasks";
import { FindSimilar } from "@/components/ai/find-similar";
import { SuggestTags } from "@/components/ai/suggest-tags";
import { toast } from "@/lib/stores/toast-store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PROJECT_STATUSES, PRIORITIES } from "@/lib/utils/constants";
import { useRouter } from "next/navigation";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: tasks, isLoading: tasksLoading } = useTasks(id);
  const router = useRouter();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const deleteTask = useDeleteTask();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<string>("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<string>("active");
  const [editPriority, setEditPriority] = useState<string>("");
  const [editColor, setEditColor] = useState("#5B7FD6");

  const openEditDialog = () => {
    if (!project) return;
    setEditTitle(project.title);
    setEditDescription(project.description || "");
    setEditStatus(project.status);
    setEditPriority(project.priority || "");
    setEditColor(project.color);
    setEditOpen(true);
  };

  const handleSaveProject = async () => {
    try {
      await updateProject.mutateAsync({
        id,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        status: editStatus as "active" | "paused" | "completed" | "archived",
        priority: (editPriority || null) as "low" | "medium" | "high" | "critical" | null,
        color: editColor,
      });
      setEditOpen(false);
      toast.success("Project updated", editTitle.trim());
    } catch (err) {
      toast.error("Failed to update project", (err as Error).message);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProject.mutateAsync(id);
      toast.success("Project deleted");
      router.push("/projects");
    } catch (err) {
      toast.error("Failed to delete project", (err as Error).message);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    try {
      await deleteTask.mutateAsync(deleteTaskId);
      setDeleteTaskId(null);
      toast.success("Task deleted");
    } catch (err) {
      toast.error("Failed to delete task", (err as Error).message);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await createTask.mutateAsync({
        projectId: id,
        title: newTaskTitle.trim(),
        status: "todo",
        priority: (newTaskPriority || undefined) as "low" | "medium" | "high" | undefined,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
        sortOrder: (tasks?.length || 0) + 1,
      });
      setNewTaskTitle("");
      setNewTaskPriority("");
      setNewTaskDueDate("");
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
          <Button variant="ghost" size="sm" onClick={openEditDialog}>
            <Pencil className="w-4 h-4" />
            Edit
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
              <form onSubmit={handleAddTask} className="mb-4 space-y-2">
                <div className="flex gap-2">
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
                </div>
                <div className="flex gap-2">
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="h-8 px-2 text-xs rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] cursor-pointer"
                  >
                    <option value="">Priority...</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="h-8 px-2 text-xs rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] cursor-pointer"
                  />
                </div>
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
                    {task.dueDate && (
                      <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
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
                    <button
                      onClick={() => setDeleteTaskId(task.id)}
                      className="flex-shrink-0 p-1 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

          {/* Danger Zone */}
          <Card>
            <h3 className="text-sm font-semibold text-[var(--danger)] mb-2">
              Danger Zone
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-3">
              Permanently delete this project and all its tasks.
            </p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteProjectOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
            </Button>
          </Card>
        </div>
      </div>

      {/* Confirm Delete Project */}
      <ConfirmDialog
        open={deleteProjectOpen}
        onOpenChange={setDeleteProjectOpen}
        title="Delete Project?"
        description={`This will permanently delete "${project.title}" and all associated tasks. This action cannot be undone.`}
        confirmLabel="Delete Project"
        onConfirm={handleDeleteProject}
        loading={deleteProject.isPending}
      />

      {/* Confirm Delete Task */}
      <ConfirmDialog
        open={!!deleteTaskId}
        onOpenChange={(open) => !open && setDeleteTaskId(null)}
        title="Delete Task?"
        description="This will permanently delete this task. This action cannot be undone."
        confirmLabel="Delete Task"
        onConfirm={handleDeleteTask}
        loading={deleteTask.isPending}
      />
      {/* Edit Project Dialog */}
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-md z-50">
            <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
                <Dialog.Title className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Pencil className="w-4 h-4" />
                  Edit Project
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="p-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] cursor-pointer"
                    >
                      {PROJECT_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Priority</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="w-full h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] cursor-pointer"
                    >
                      <option value="">None</option>
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-9 h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] cursor-pointer p-0.5"
                    />
                    <span className="text-xs text-[var(--text-tertiary)] font-mono">{editColor}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="sm">Cancel</Button>
                  </Dialog.Close>
                  <Button
                    size="sm"
                    onClick={handleSaveProject}
                    disabled={!editTitle.trim() || updateProject.isPending}
                  >
                    {updateProject.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </PageShell>
  );
}
