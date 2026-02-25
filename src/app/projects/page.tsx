"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { FolderKanban, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useProjects } from "@/lib/hooks/use-projects";
import { type ProjectStatus } from "@/lib/utils/constants";
import Link from "next/link";

const statusFilters: { label: string; value: ProjectStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Completed", value: "completed" },
  { label: "Archived", value: "archived" },
];

export default function ProjectsPage() {
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { data: projects, isLoading, error } = useProjects(filter !== "all" ? filter : undefined);

  const filtered = projects?.filter((p) =>
    search ? p.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <PageShell
      title="Projects"
      description="Track and manage all your projects"
      actions={
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      }
    >
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-[var(--radius-md)] bg-[var(--gray-100)] border border-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:bg-[var(--surface-card)] focus:border-[var(--border-default)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
          />
        </div>

        <div className="flex items-center gap-1">
          {statusFilters.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                filter === s.value
                  ? "bg-[var(--accent-50)] text-[var(--accent-500)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-3" />
              <Skeleton className="h-2 w-full mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-14" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <p className="text-sm text-[var(--danger)] text-center py-8">
            Failed to load projects. Make sure your database is configured.
          </p>
        </Card>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const progress = project.taskStats
              ? project.taskStats.total > 0
                ? Math.round((project.taskStats.done / project.taskStats.total) * 100)
                : 0
              : 0;

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card interactive className="h-full">
                  <div
                    className="w-full h-1 rounded-full mb-3"
                    style={{ backgroundColor: project.color }}
                  />

                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 line-clamp-1">
                    {project.title}
                  </h3>

                  {project.description && (
                    <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {project.taskStats && project.taskStats.total > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-1">
                        <span>{project.taskStats.done}/{project.taskStats.total} tasks</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-[var(--gray-100)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: project.color }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
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
                    {project.priority && (
                      <Badge
                        variant={
                          project.priority === "high" || project.priority === "critical" ? "danger"
                            : project.priority === "medium" ? "warning"
                            : "default"
                        }
                      >
                        {project.priority}
                      </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to start tracking your work. Each project can have tasks, time tracking, and more."
            action={{
              label: "Create Project",
              onClick: () => setCreateOpen(true),
            }}
          />
        </Card>
      )}

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </PageShell>
  );
}
