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
  LineChart,
  Line,
} from "recharts";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/lib/hooks/use-projects";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useIdeas } from "@/lib/hooks/use-ideas";
import { useKBArticles } from "@/lib/hooks/use-kb";
import { Flame, TrendingUp, Activity, Heart } from "lucide-react";

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
  icon: Icon,
}: {
  label: string;
  value: string;
  subtitle?: string;
  color: string;
  icon?: React.ElementType;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
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
        {Icon && (
          <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Productivity Heatmap ─────────────────────────────────

function ProductivityHeatmap({ tasks }: { tasks: Array<{ createdAt: string; completedDate: string | null }> }) {
  const heatmapData = useMemo(() => {
    // Build a 7 (days) x 24 (hours) grid of activity counts
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

    for (const t of tasks) {
      // Count by creation time as a proxy for activity
      const d = new Date(t.createdAt);
      grid[d.getDay()][d.getHours()]++;
      // Also count completions
      if (t.completedDate) {
        const cd = new Date(t.completedDate);
        grid[cd.getDay()][cd.getHours()]++;
      }
    }

    return grid;
  }, [tasks]);

  const maxVal = Math.max(1, ...heatmapData.flat());
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: 24 }, (_, i) =>
    i === 0 ? "12a" : i < 12 ? `${i}a` : i === 12 ? "12p" : `${i - 12}p`
  );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        {/* Hour labels */}
        <div className="flex mb-1 ml-10">
          {hours.filter((_, i) => i % 3 === 0).map((h, i) => (
            <span key={i} className="text-[9px] text-[var(--text-tertiary)]" style={{ width: `${(3 / 24) * 100}%` }}>
              {h}
            </span>
          ))}
        </div>
        {/* Grid rows */}
        {days.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-1 mb-0.5">
            <span className="text-[10px] text-[var(--text-tertiary)] w-8 text-right">{day}</span>
            <div className="flex-1 flex gap-px">
              {heatmapData[dayIdx].map((val, hourIdx) => {
                const intensity = val / maxVal;
                return (
                  <div
                    key={hourIdx}
                    className="flex-1 aspect-square rounded-sm"
                    style={{
                      backgroundColor: val === 0
                        ? "var(--gray-100)"
                        : `rgba(91, 127, 214, ${0.15 + intensity * 0.85})`,
                    }}
                    title={`${day} ${hours[hourIdx]}: ${val} activities`}
                  />
                );
              })}
            </div>
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2 ml-10">
          <span className="text-[9px] text-[var(--text-tertiary)]">Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: intensity === 0
                  ? "var(--gray-100)"
                  : `rgba(91, 127, 214, ${0.15 + intensity * 0.85})`,
              }}
            />
          ))}
          <span className="text-[9px] text-[var(--text-tertiary)]">More</span>
        </div>
      </div>
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
    const stages = [
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

  // ── Velocity data (tasks completed per week, last 8 weeks) ─

  const velocityData = useMemo(() => {
    if (!tasks) return [];

    const now = new Date();
    const weeks: Array<{ label: string; completed: number }> = [];

    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const completed = tasks.filter((t) =>
        isInWeekRange(t.completedDate, weekStart, weekEnd)
      ).length;

      weeks.push({
        label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        completed,
      });
    }

    return weeks;
  }, [tasks]);

  // ── Streak calculation ──────────────────────────────

  const streak = useMemo(() => {
    if (!tasks) return 0;

    const completedDates = tasks
      .filter((t) => t.completedDate)
      .map((t) => new Date(t.completedDate!).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (completedDates.length === 0) return 0;

    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < completedDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);

      if (completedDates.includes(expected.toDateString())) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }, [tasks]);

  // ── Project health scores ──────────────────────────

  const projectHealth = useMemo(() => {
    if (!projects || !tasks) return [];

    return projects
      .filter((p) => p.taskStats && p.taskStats.total > 0)
      .map((p) => {
        const projectTasks = tasks.filter((t) => t.projectId === p.id);
        const total = projectTasks.length;
        const done = projectTasks.filter((t) => t.status === "done").length;
        const overdue = projectTasks.filter((t) => {
          if (!t.dueDate || t.status === "done") return false;
          return new Date(t.dueDate) < new Date();
        }).length;

        const completionRate = total > 0 ? done / total : 0;
        const overdueRate = total > 0 ? overdue / total : 0;

        // Health score: 100 base, penalize for low completion and overdue tasks
        const score = Math.max(0, Math.min(100,
          Math.round(completionRate * 60 + (1 - overdueRate) * 40)
        ));

        return {
          id: p.id,
          name: p.title,
          color: p.color,
          score,
          completionRate: Math.round(completionRate * 100),
          overdueCount: overdue,
          totalTasks: total,
          doneTasks: done,
        };
      })
      .sort((a, b) => a.score - b.score); // worst health first
  }, [projects, tasks]);

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
          label="Completion Rate"
          value={`${completionRate}%`}
          subtitle={`${taskCounts.done} of ${taskCounts.total} tasks done`}
          color="#22c55e"
          icon={TrendingUp}
        />
        <StatCard
          label="Current Streak"
          value={`${streak}d`}
          subtitle={streak > 0 ? "consecutive days with completions" : "complete a task to start"}
          color="#f59e0b"
          icon={Flame}
        />
        <StatCard
          label="This Week"
          value={String(weeklyStats.thisWeek)}
          subtitle={
            weeklyDelta > 0
              ? `+${weeklyDelta} vs last week`
              : weeklyDelta < 0
                ? `${weeklyDelta} vs last week`
                : "same as last week"
          }
          color="#5B7FD6"
          icon={Activity}
        />
        <StatCard
          label="Ideas Pipeline"
          value={String(totalIdeas)}
          subtitle={`${ideas?.filter((i) => i.stage === "ready").length ?? 0} ready to build`}
          color="#8b5cf6"
        />
      </div>

      {/* ── Charts Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Velocity Chart ───────────────────────── */}
        <Card>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            Velocity (Tasks/Week)
          </h3>
          {velocityData.some((d) => d.completed > 0) ? (
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={velocityData} margin={{ top: 5, right: 20, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--border-default)" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 shadow-[var(--shadow-md)]">
                          <p className="text-xs font-medium text-[var(--text-primary)]">Week of {label}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{payload[0].value} tasks completed</p>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#5B7FD6"
                    strokeWidth={2}
                    dot={{ fill: "#5B7FD6", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: "#5B7FD6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[var(--text-tertiary)]">Complete some tasks to see velocity</p>
            </div>
          )}
        </Card>

        {/* ── Task Status Breakdown ─────────────────── */}
        <Card>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            Task Status Breakdown
          </h3>
          {taskStatusData.length > 0 ? (
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
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
                          <p className="text-xs font-medium text-[var(--text-primary)]">{item.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{item.value} tasks</p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => (
                      <span className="text-xs text-[var(--text-secondary)]">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[var(--text-tertiary)]">No tasks created yet</p>
            </div>
          )}
        </Card>

        {/* ── Productivity Heatmap ──────────────────── */}
        <Card>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            Activity Heatmap
          </h3>
          {tasks && tasks.length > 0 ? (
            <ProductivityHeatmap tasks={tasks} />
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[var(--text-tertiary)]">Activity heatmap will populate as you work</p>
            </div>
          )}
        </Card>

        {/* ── Project Progress ──────────────────────── */}
        <Card>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            Project Progress
          </h3>
          {projectProgressData.length > 0 ? (
            <div
              className="w-full"
              style={{
                height: Math.max(200, projectProgressData.length * 50 + 40),
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
                          <p className="text-xs font-medium text-[var(--text-primary)]">{label}</p>
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
              <p className="text-sm text-[var(--text-tertiary)]">No projects with tasks yet</p>
            </div>
          )}
        </Card>

        {/* ── Ideas Pipeline ────────────────────────── */}
        <Card>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            Ideas Pipeline
          </h3>
          {totalIdeas > 0 ? (
            <div className="w-full h-[250px]">
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
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 shadow-[var(--shadow-md)]">
                          <p className="text-xs font-medium text-[var(--text-primary)]">{label}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{payload[0].value} ideas</p>
                        </div>
                      );
                    }}
                  />
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
              <p className="text-sm text-[var(--text-tertiary)]">No ideas captured yet</p>
            </div>
          )}
        </Card>

        {/* ── Project Health Scores ─────────────────── */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-[var(--text-secondary)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Project Health
            </h3>
          </div>
          {projectHealth.length > 0 ? (
            <div className="space-y-3">
              {projectHealth.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-sm text-[var(--text-primary)] flex-1 truncate">{p.name}</span>
                  <div className="flex items-center gap-2">
                    {p.overdueCount > 0 && (
                      <Badge size="sm" variant="danger">{p.overdueCount} overdue</Badge>
                    )}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor:
                          p.score >= 70 ? "#22c55e15" :
                          p.score >= 40 ? "#f59e0b15" :
                          "#ef444415",
                        color:
                          p.score >= 70 ? "#22c55e" :
                          p.score >= 40 ? "#f59e0b" :
                          "#ef4444",
                      }}
                    >
                      {p.score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[var(--text-tertiary)]">Add tasks to projects to see health scores</p>
            </div>
          )}
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
