import { z } from "zod";

// ── Projects ───────────────────────────────────────────

export const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["active", "paused", "completed", "archived"]).default("active"),
  priority: z.enum(["low", "medium", "high", "critical"]).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#5B7FD6"),
  startDate: z.string().datetime().nullable().optional(),
  targetDate: z.string().datetime().nullable().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ── Tasks ──────────────────────────────────────────────

export const createTaskSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });

// ── Ideas ──────────────────────────────────────────────

export const createIdeaSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  body: z.string().max(10000).nullable().optional(),
  stage: z.enum(["spark", "exploring", "validating", "ready"]).default("spark"),
  category: z.string().max(100).nullable().optional(),
  projectId: z.string().nullable().optional(),
});

export const updateIdeaSchema = createIdeaSchema.partial();

// ── KB Articles ────────────────────────────────────────

export const createKBArticleSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  content: z.string().default(""),
  summary: z.string().max(500).nullable().optional(),
  pinned: z.boolean().optional().default(false),
});

export const updateKBArticleSchema = createKBArticleSchema.partial();

// ── Tags ───────────────────────────────────────────────

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#5B7FD6"),
});

// ── Time Sessions ──────────────────────────────────────

export const createTimeSessionSchema = z.object({
  projectId: z.string().nullable().optional(),
  taskId: z.string().nullable().optional(),
  type: z.enum(["auto", "manual", "logged"]),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(), // minutes
  notes: z.string().max(1000).nullable().optional(),
});

export const updateTimeSessionSchema = z.object({
  endedAt: z.string().datetime().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

// ── Activity ───────────────────────────────────────────

export const createActivitySchema = z.object({
  entityId: z.string().nullable().optional(),
  entityType: z.enum(["project", "task", "idea", "kb_article", "integration"]).nullable().optional(),
  action: z.enum(["created", "updated", "completed", "promoted", "synced", "deleted"]),
  title: z.string().min(1).max(300),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  source: z.enum(["local", "asana", "gmail", "calendar", "github"]).default("local"),
});

// ── Tag Assignments ────────────────────────────────────

export const createTagAssignmentSchema = z.object({
  tagId: z.string().min(1),
  entityId: z.string().min(1),
  entityType: z.enum(["project", "idea", "kb_article"]),
});

// ── Types ──────────────────────────────────────────────

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
export type CreateKBArticleInput = z.infer<typeof createKBArticleSchema>;
export type UpdateKBArticleInput = z.infer<typeof updateKBArticleSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type CreateTimeSessionInput = z.infer<typeof createTimeSessionSchema>;
export type UpdateTimeSessionInput = z.infer<typeof updateTimeSessionSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type CreateTagAssignmentInput = z.infer<typeof createTagAssignmentSchema>;
