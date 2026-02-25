"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban,
  ListTodo,
  Lightbulb,
  BookOpen,
  Calendar,
  Mail,
  Activity,
  Sparkles,
} from "lucide-react";
import { useProjects } from "@/lib/hooks/use-projects";
import { useIdeas } from "@/lib/hooks/use-ideas";
import { useKBArticles } from "@/lib/hooks/use-kb";
import { useTasks } from "@/lib/hooks/use-tasks";
import Link from "next/link";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  loading,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  loading?: boolean;
  href?: string;
}) {
  const content = (
    <Card className="flex items-center gap-4" interactive={!!href}>
      <div
        className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        {loading ? (
          <Skeleton className="h-7 w-8 mb-1" />
        ) : (
          <p className="text-2xl font-bold" style={{ color }}>
            {value}
          </p>
        )}
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      </div>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function DashboardPage() {
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const { data: projects, isLoading: projectsLoading } = useProjects("active");
  const { data: allTasks, isLoading: tasksLoading } = useTasks();
  const { data: ideas, isLoading: ideasLoading } = useIdeas();
  const { data: articles, isLoading: articlesLoading } = useKBArticles();

  const pendingTasks = allTasks?.filter((t) => t.status !== "done").length || 0;

  return (
    <PageShell title={`${greeting}, Jackie`} description={dateStr}>
      {/* Quick Capture */}
      <div className="relative max-w-xl">
        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Quick capture... idea, task, or note"
          className="w-full h-11 pl-10 pr-4 text-sm rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
        />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderKanban}
          label="Active Projects"
          value={projects?.length || 0}
          color="#5B7FD6"
          loading={projectsLoading}
          href="/projects"
        />
        <StatCard
          icon={ListTodo}
          label="Pending Tasks"
          value={pendingTasks}
          color="#f59e0b"
          loading={tasksLoading}
        />
        <StatCard
          icon={Lightbulb}
          label="Ideas Brewing"
          value={ideas?.length || 0}
          color="#8b5cf6"
          loading={ideasLoading}
          href="/ideas"
        />
        <StatCard
          icon={BookOpen}
          label="KB Articles"
          value={articles?.length || 0}
          color="#22c55e"
          loading={articlesLoading}
          href="/kb"
        />
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's Focus */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ListTodo className="w-5 h-5 text-[var(--text-secondary)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Today&apos;s Focus</h3>
          </div>
          {tasksLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : pendingTasks > 0 ? (
            <div className="space-y-1">
              {allTasks
                ?.filter((t) => t.status !== "done")
                .slice(0, 5)
                .map((task) => (
                  <div key={task.id} className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-500)]" />
                    <span className="text-sm text-[var(--text-primary)] line-clamp-1">{task.title}</span>
                  </div>
                ))}
              {pendingTasks > 5 && (
                <p className="text-xs text-[var(--text-tertiary)] pl-5 pt-1">
                  +{pendingTasks - 5} more tasks
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
              No tasks pending. Create a project to get started!
            </p>
          )}
        </Card>

        {/* Upcoming Events */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-[var(--text-secondary)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Upcoming</h3>
          </div>
          <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
            Connect Google Calendar in Settings to see upcoming events.
          </p>
        </Card>

        {/* Recent Projects */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-[var(--text-secondary)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Recent Projects</h3>
          </div>
          {projectsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="space-y-1">
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-3 px-2 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-sm text-[var(--text-primary)] flex-1 line-clamp-1">
                    {project.title}
                  </span>
                  {project.taskStats && project.taskStats.total > 0 && (
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {project.taskStats.done}/{project.taskStats.total}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
              No active projects. Create one to get started!
            </p>
          )}
        </Card>

        {/* Email Highlights */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-[var(--text-secondary)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Email Highlights</h3>
          </div>
          <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
            Connect Gmail in Settings to see email highlights.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
