import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============================================================
// PROJECTS
// ============================================================
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["active", "paused", "completed", "archived"] }).notNull().default("active"),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }),
  color: text("color").default("#5B7FD6"),
  startDate: integer("start_date", { mode: "timestamp" }),
  targetDate: integer("target_date", { mode: "timestamp" }),
  completedDate: integer("completed_date", { mode: "timestamp" }),
  externalId: text("external_id"),
  externalSource: text("external_source", { enum: ["asana", "github"] }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  timeSessions: many(timeSessions),
  healthSnapshots: many(projectHealth),
}));

// ============================================================
// TASKS
// ============================================================
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["todo", "in_progress", "done"] }).notNull().default("todo"),
  priority: text("priority", { enum: ["low", "medium", "high"] }),
  dueDate: integer("due_date", { mode: "timestamp" }),
  completedDate: integer("completed_date", { mode: "timestamp" }),
  sortOrder: integer("sort_order").notNull().default(0),
  externalId: text("external_id"),
  externalSource: text("external_source", { enum: ["asana", "github"] }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  timeSessions: many(timeSessions),
}));

// ============================================================
// IDEAS
// ============================================================
export const ideas = sqliteTable("ideas", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body"),
  stage: text("stage", { enum: ["spark", "exploring", "validating", "ready"] }).notNull().default("spark"),
  category: text("category"),
  projectId: text("project_id").references(() => projects.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const ideasRelations = relations(ideas, ({ one }) => ({
  project: one(projects, {
    fields: [ideas.projectId],
    references: [projects.id],
  }),
}));

// ============================================================
// KNOWLEDGE BASE ARTICLES
// ============================================================
export const kbArticles = sqliteTable("kb_articles", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull().default(""),
  summary: text("summary"),
  pinned: integer("pinned", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================
// TAGS
// ============================================================
export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").default("#5B7FD6"),
});

// ============================================================
// TAG ASSIGNMENTS (polymorphic join)
// ============================================================
export const tagAssignments = sqliteTable("tag_assignments", {
  id: text("id").primaryKey(),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  entityId: text("entity_id").notNull(),
  entityType: text("entity_type", { enum: ["project", "idea", "kb_article"] }).notNull(),
});

export const tagAssignmentsRelations = relations(tagAssignments, ({ one }) => ({
  tag: one(tags, {
    fields: [tagAssignments.tagId],
    references: [tags.id],
  }),
}));

// ============================================================
// ACTIVITIES (append-only log)
// ============================================================
export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  entityId: text("entity_id"),
  entityType: text("entity_type", { enum: ["project", "task", "idea", "kb_article", "integration"] }),
  action: text("action", { enum: ["created", "updated", "completed", "promoted", "synced", "deleted"] }).notNull(),
  title: text("title").notNull(),
  metadata: text("metadata"), // JSON string
  source: text("source", { enum: ["local", "asana", "gmail", "calendar", "github"] }).notNull().default("local"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================
// TIME SESSIONS
// ============================================================
export const timeSessions = sqliteTable("time_sessions", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
  taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
  type: text("type", { enum: ["auto", "manual", "logged"] }).notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  endedAt: integer("ended_at", { mode: "timestamp" }),
  duration: integer("duration"), // minutes
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const timeSessionsRelations = relations(timeSessions, ({ one }) => ({
  project: one(projects, {
    fields: [timeSessions.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [timeSessions.taskId],
    references: [tasks.id],
  }),
}));

// ============================================================
// DAILY SUMMARIES (aggregated stats)
// ============================================================
export const dailySummaries = sqliteTable("daily_summaries", {
  id: text("id").primaryKey(),
  date: text("date").notNull().unique(), // YYYY-MM-DD
  totalMinutes: integer("total_minutes").notNull().default(0),
  projectBreakdown: text("project_breakdown"), // JSON: { projectId: minutes }
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  ideasCreated: integer("ideas_created").notNull().default(0),
  articlesWritten: integer("articles_written").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================
// PROJECT HEALTH (daily snapshots)
// ============================================================
export const projectHealth = sqliteTable("project_health", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  completionRate: integer("completion_rate"), // 0-100
  overdueRate: integer("overdue_rate"), // 0-100
  velocity: integer("velocity"), // tasks completed in last 7 days
  healthScore: integer("health_score"), // 0-100 composite
  computedAt: integer("computed_at", { mode: "timestamp" }).notNull(),
});

export const projectHealthRelations = relations(projectHealth, ({ one }) => ({
  project: one(projects, {
    fields: [projectHealth.projectId],
    references: [projects.id],
  }),
}));

// ============================================================
// INTEGRATION CONFIGS
// ============================================================
export const integrationConfigs = sqliteTable("integration_configs", {
  id: text("id").primaryKey(),
  provider: text("provider", { enum: ["asana", "gmail", "calendar", "github"] }).notNull().unique(),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  config: text("config"), // JSON string
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================
// INTEGRATION CACHE
// ============================================================
export const integrationCache = sqliteTable("integration_cache", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  dataType: text("data_type").notNull(), // tasks, emails, events, repos
  data: text("data").notNull(), // JSON string
  fetchedAt: integer("fetched_at", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

// ============================================================
// EMBEDDINGS (for AI semantic search)
// ============================================================
export const embeddings = sqliteTable("embeddings", {
  id: text("id").primaryKey(),
  entityId: text("entity_id").notNull(),
  entityType: text("entity_type", { enum: ["project", "task", "idea", "kb_article"] }).notNull(),
  vector: text("vector").notNull(), // JSON-serialized float array (Turso vector support)
  content: text("content").notNull(), // Original text that was embedded
  model: text("model").notNull().default("text-embedding-3-small"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
