"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  ListTodo,
  Lightbulb,
  BookOpen,
  Calendar,
  Mail,
  Activity,
  ExternalLink,
  Settings,
} from "lucide-react";
import { SmartCapture } from "@/components/ai/smart-capture";
import { useProjects } from "@/lib/hooks/use-projects";
import { useIdeas } from "@/lib/hooks/use-ideas";
import { useKBArticles } from "@/lib/hooks/use-kb";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useCachedIntegration } from "@/lib/hooks/use-integrations";
import { useAppStore } from "@/lib/stores/app-store";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

// ── Types ───────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  htmlLink: string;
}

interface CachedCalendarData {
  events: CalendarEvent[];
}

interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  unread: boolean;
}

interface CachedGmailData {
  messages: EmailMessage[];
  unreadCount: number;
}

interface ActivityItem {
  id: string;
  action: string;
  title: string;
  source: string;
  entityType: string | null;
  createdAt: string;
}

// ── Stat Card ───────────────────────────────────────────

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

// ── Helpers ─────────────────────────────────────────────

function formatEventTime(start: string): string {
  const d = new Date(start);
  if (isNaN(d.getTime())) return start; // all-day events might be "YYYY-MM-DD"
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatEventDate(start: string): string {
  const d = new Date(start);
  if (isNaN(d.getTime())) return start;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatEmailFrom(from: string): string {
  // "Name <email>" → "Name"
  const match = from.match(/^(.+?)\s*<.*>$/);
  return match ? match[1].replace(/"/g, "") : from;
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Main Dashboard ──────────────────────────────────────

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

  const { displayName } = useAppStore();
  const { data: projects, isLoading: projectsLoading } = useProjects("active");
  const { data: allTasks, isLoading: tasksLoading } = useTasks();
  const { data: ideas, isLoading: ideasLoading } = useIdeas();
  const { data: articles, isLoading: articlesLoading } = useKBArticles();

  // Integration cached data
  const { data: calendarData } = useCachedIntegration<CachedCalendarData>("calendar");
  const { data: gmailData } = useCachedIntegration<CachedGmailData>("gmail");

  // Recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ["activities-recent"],
    queryFn: async () => {
      const res = await fetch("/api/activities?limit=8");
      const json = await res.json();
      return json.data as ActivityItem[];
    },
    staleTime: 60 * 1000,
  });

  const pendingTasks = allTasks?.filter((t) => t.status !== "done").length || 0;

  return (
    <PageShell title={`${greeting}, ${displayName}`} description={dateStr}>
      {/* Smart Capture */}
      <SmartCapture />

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
                    <span className="text-sm text-[var(--text-primary)] line-clamp-1 flex-1">{task.title}</span>
                    {task.priority && (
                      <Badge size="sm" variant={task.priority === "high" ? "danger" : "default"}>
                        {task.priority}
                      </Badge>
                    )}
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

        {/* Upcoming Events (Calendar) */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--text-secondary)]" />
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Upcoming</h3>
            </div>
            {calendarData?.events && calendarData.events.length > 0 && (
              <span className="text-xs text-[var(--text-tertiary)]">{calendarData.events.length} events</span>
            )}
          </div>
          {calendarData?.events && calendarData.events.length > 0 ? (
            <div className="space-y-2">
              {calendarData.events.slice(0, 5).map((event) => (
                <a
                  key={event.id}
                  href={event.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 px-2 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)] transition-colors group"
                >
                  <div className="flex flex-col items-center min-w-[44px] pt-0.5">
                    <span className="text-[10px] font-medium text-[var(--accent-500)] uppercase">
                      {formatEventDate(event.start)}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {formatEventTime(event.start)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] line-clamp-1">{event.summary}</p>
                    {event.location && (
                      <p className="text-[10px] text-[var(--text-tertiary)] line-clamp-1 mt-0.5">{event.location}</p>
                    )}
                  </div>
                  <ExternalLink className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1" />
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--text-tertiary)]">
                No upcoming events.
              </p>
              <Link href="/settings" className="text-xs text-[var(--accent-500)] hover:underline inline-flex items-center gap-1 mt-1">
                <Settings className="w-3 h-3" />
                Connect Google Calendar
              </Link>
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--text-secondary)]" />
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Recent Activity</h3>
            </div>
            <Link href="/activity" className="text-xs text-[var(--accent-500)] hover:underline">
              View all
            </Link>
          </div>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-1">
              {recentActivity.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-2 py-1.5 rounded-[var(--radius-sm)]">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
                    backgroundColor:
                      item.action === "created" ? "#22c55e"
                      : item.action === "completed" ? "#5B7FD6"
                      : item.action === "updated" ? "#f59e0b"
                      : "#94a3b8",
                  }} />
                  <span className="text-sm text-[var(--text-primary)] flex-1 line-clamp-1">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0">
                    {timeAgo(item.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
              Activity will appear as you work.
            </p>
          )}
        </Card>

        {/* Email Highlights (Gmail) */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[var(--text-secondary)]" />
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Email Highlights</h3>
            </div>
            {gmailData?.unreadCount !== undefined && gmailData.unreadCount > 0 && (
              <Badge variant="danger" size="sm">{gmailData.unreadCount} unread</Badge>
            )}
          </div>
          {gmailData?.messages && gmailData.messages.length > 0 ? (
            <div className="space-y-1">
              {gmailData.messages.slice(0, 5).map((msg) => (
                <div
                  key={msg.id}
                  className={`px-2 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)] transition-colors ${
                    msg.unread ? "bg-[var(--accent-50)]/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    {msg.unread && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-500)] flex-shrink-0" />}
                    <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
                      {formatEmailFrom(msg.from)}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0 ml-auto">
                      {timeAgo(msg.date)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] line-clamp-1">{msg.subject}</p>
                  <p className="text-xs text-[var(--text-tertiary)] line-clamp-1 mt-0.5">{msg.snippet}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--text-tertiary)]">
                No emails to show.
              </p>
              <Link href="/settings" className="text-xs text-[var(--accent-500)] hover:underline inline-flex items-center gap-1 mt-1">
                <Settings className="w-3 h-3" />
                Connect Gmail
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-[var(--text-secondary)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Recent Projects</h3>
          </div>
          <Link href="/projects" className="text-xs text-[var(--accent-500)] hover:underline">
            View all
          </Link>
        </div>
        {projectsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border-default)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {project.title}
                  </p>
                  {project.taskStats && project.taskStats.total > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-[var(--gray-100)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((project.taskStats.done / project.taskStats.total) * 100)}%`,
                            backgroundColor: project.color,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        {project.taskStats.done}/{project.taskStats.total}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
            No active projects. Create one to get started!
          </p>
        )}
      </Card>
    </PageShell>
  );
}
