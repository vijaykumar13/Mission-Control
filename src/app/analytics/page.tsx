"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/lib/hooks/use-projects";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useIdeas } from "@/lib/hooks/use-ideas";
import { useKBArticles } from "@/lib/hooks/use-kb";

// ── Helpers ──────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isInWeekRange(
  dateStr: string | null,
  weekStart: Date,
  weekEnd: Date
): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= weekStart && d < weekEnd;
}

// ── Stat Card ────────────────────────────────────────────

function StatCard({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: string;
  subtitle?: string;
  color: string;
}) {
  return (
    <Card>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          {label}
        </p>
        <p className="text-3xl font-bold" style={{ color }}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-[var(--text-tertiary)]">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}

// ── Custom Tooltip ───────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; payload: Record<string, unknown> }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 shadow-[var(--shadow-md)]">
      <p className="text-xs font-medium text-[var(--text-primary)] mb-1">
        {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-[var(--text-secondary)]">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: ideas, isLoading: ideasLoading } = useIdeas();
  const { data: articles, isLoading: articlesLoading } = useKBArticles();

  const isLoading =
    projectsLoading || tasksLoading || ideasLoading || articlesLoading;

  // ── Computed data ────────────────────────────────────

  const totalProjects = projects?.length ?? 0;
  const totalIdeas = ideas?.length ?? 0;
  const totalArticles = articles?.length ?? 0;

  const taskCounts = useMemo(() => {
    if (!tasks) return { total: 0, todo: 0, in_progress: 0, done: 0 };
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      done: tasks.filter((t) => t.status === "done").length,
    };
  }, [tasks]);

  const completionRate =
    taskCounts.total > 0
      ? Math.round((taskCounts.done / taskCounts.total) * 100)
      : 0;

  // ── Project progress data ───────────────────────────

  const projectProgressData = useMemo(() => {
    if (!projects) return [];
    return projects
      .filter((p) => p.taskStats && p.taskStats.total > 0)
      .map((p) => ({
        name:
          p.title.length > 20 ? p.title.substring(0, 20) + "..." : p.title,
        completion: Math.round(
          ((p.taskStats?.done ?? 0) / (p.taskStats?.total ?? 1)) * 100
        ),
        done: p.taskStats?.done ?? 0,
        total: p.taskStats?.total ?? 0,
        color: p.color,
      }));
  }, [projects]);

  // ── Task status pie data ────────────────────────────

  const taskStatusData = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    return [
      { name: "To Do", value: taskCounts.todo, color: "#94a3b8" },
      { name: "In Progress", value: taskCounts.in_progress, color: "#f59e0b" },
      { name: "Done", value: taskCounts.done, color: "#22c55e" },
    ].filter((d) => d.value > 0);
  }, [tasks, taskCounts]);

  // ── Ideas pipeline data ─────────────────────────────

  const ideaStageData = useMemo(() => {
    if (!ideas) return [];
    const stages: Array<{
      stage: string;
      label: string;
      color: string;
    }> = [
      { stage: "spark", label: "Spark", color: "#8b5cf6" },
      { stage: "exploring", label: "Exploring", color: "#3b82f6" },
      { stage: "validating", label: "Validating", color: "#f59e0b" },
      { stage: "ready", label: "Ready", color: "#22c55e" },
    ];
    return stages.map((s) => ({
      name: s.label,
      count: ideas.filter((i) => i.stage === s.stage).length,
      color: s.color,
    }));
  }, [ideas]);

  // ── Weekly productivity ─────────────────────────────

  const weeklyStats = useMemo(() => {
    if (!tasks) return { thisWeek: 0, lastWeek: 0 };

    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    return {
      thisWeek: tasks.filter((t) =>
        isInWeekRange(t.completedDate, thisWeekStart, thisWeekEnd)
      ).length,
      lastWeek: tasks.filter((t) =>
        isInWeekRange(t.completedDate, lastWeekStart, thisWeekStart)
      ).length,
    };
  }, [tasks]);

  const weeklyDelta = weeklyStats.thisWeek - weeklyStats.lastWeek;

  // ── Loading state ───────────────────────────────────

  if (isLoading) {
    return (
      <PageShell
        title="Analytics"
        description="Insights into your productivity and work patterns"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-40 mb-4" />
              <Skeleton className="h-[300px] w-full" />
            </Card>
          ))}
        </div>
      </PageShell>
    );
  }

  // ── Render ──────────────────────────────────────────

  return (
    <PageShell
      title="Analytics"
      description="Insights into your productivity and work patterns"
    >
      {/* ── Summary Stats Row ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={String(totalProjects)}
          subtitle={`${projects?.filter((p) => p.status === "active").length ?? 0} active`}
          color="#5B7FD6"
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          subtitle={`${taskCounts.done} of ${taskCounts.total} tasks done`}
          color="#22c55e"
        />
        <StatCard
          label="Ideas Pipeline"
          value={String(totalIdeas)}
          subtitle={`${ideas?.filter((i) => i.stage === "ready").length ?? 0} ready to build`}
          color="#8b5cf6"
        />
        <StatCard
          label="Knowledge Base"
          value={String(totalArticles)}
          subtitle="articles"
          color="#3b82f6"
        />
      </div>

      {/* ── Charts Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Project Progress ──────────────────────── */}
        <Card>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            Project Progress
          </h3>
          {projectProgressData.length > 0 ? (
            <div
              className="w-full"
              style={{
                height: Math.max(
                  200,
                  projectProgressData.length * 50 + 40
                ),
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectProgressData}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-default)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--border-default)" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload as (typeof projectProgressData)[0];
                      return (
                        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 shadow-[var(--shadow-md)]">
                          <p className="text-xs font-medium text-[var(--text-primary)]">
                            {label}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {item.done}/{item.total} tasks ({item.completion}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="completion" radius={[0, 4, 4, 0]} barSize={24}>
                    {projectProgressData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[var(--text-tertiary)]">
                No projects with tasks yet
              </p>
            </div>
          )}
        </Card>

        {/* ── Task Status Breakdown ─────────────────── */}
        <Card>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            Task Status Breakdown
          </h3>
          {taskStatusData.length > 0 ? (
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload as (typeof taskStatusData)[0];
                      return (
                        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 shadow-[var(--shadow-md)]">
                          <p className="text-xs font-medium text-[var(--text-primary)]">
                            {item.name}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {item.value} tasks
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => (
                      <span className="text-xs text-[var(--text-secondary)]">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[var(--text-tertiary)]">
                No tasks created yet
              </p>
            </div>
          )}
        </Card>

        {/* ── Ideas Pipeline ────────────────────────── */}
        <Card>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            Ideas Pipeline
          </h3>
          {totalIdeas > 0 ? (
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ideaStageData}
                  margin={{ top: 0, right: 16, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-default)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--border-default)" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Ideas" radius={[4, 4, 0, 0]} barSize={40}>
                    {ideaStageData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[var(--text-tertiary)]">
                No ideas captured yet
              </p>
            </div>
          )}
        </Card>

        {/* ── Activity Heatmap Placeholder ──────────── */}
        <Card>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            Activity Heatmap
          </h3>
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-[var(--text-tertiary)]">
              Activity heatmap coming with time tracking data
            </p>
          </div>
        </Card>
      </div>

      {/* ── Weekly Productivity ────────────────────────── */}
      <Card>
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Weekly Productivity
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex flex-col items-center gap-1 py-4">
            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              This Week
            </p>
            <p className="text-4xl font-bold text-[var(--text-primary)]">
              {weeklyStats.thisWeek}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">tasks completed</p>
          </div>

          <div className="flex flex-col items-center gap-1 py-4">
            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              Last Week
            </p>
            <p className="text-4xl font-bold text-[var(--text-primary)]">
              {weeklyStats.lastWeek}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">tasks completed</p>
          </div>

          <div className="flex flex-col items-center gap-1 py-4">
            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              Trend
            </p>
            <p
              className="text-4xl font-bold"
              style={{
                color:
                  weeklyDelta > 0
                    ? "#22c55e"
                    : weeklyDelta < 0
                      ? "#ef4444"
                      : "var(--text-tertiary)",
              }}
            >
              {weeklyDelta > 0 ? `+${weeklyDelta}` : String(weeklyDelta)}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              {weeklyDelta > 0
                ? "more than last week"
                : weeklyDelta < 0
                  ? "fewer than last week"
                  : "same as last week"}
            </p>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}
