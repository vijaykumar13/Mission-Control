export const APP_NAME = "Mission Control";

export const PROJECT_STATUSES = ["active", "paused", "completed", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const IDEA_STAGES = ["spark", "exploring", "validating", "ready"] as const;
export type IdeaStage = (typeof IDEA_STAGES)[number];

export const ENTITY_TYPES = ["project", "task", "idea", "kb_article"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const INTEGRATION_PROVIDERS = ["asana", "gmail", "calendar", "github"] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export const ACTIVITY_ACTIONS = ["created", "updated", "completed", "promoted", "synced", "deleted"] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVITY_SOURCES = ["local", "asana", "gmail", "calendar", "github"] as const;
export type ActivitySource = (typeof ACTIVITY_SOURCES)[number];

export const TIME_SESSION_TYPES = ["auto", "manual", "logged"] as const;
export type TimeSessionType = (typeof TIME_SESSION_TYPES)[number];

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  active: "#22c55e",
  paused: "#f59e0b",
  completed: "#5B7FD6",
  archived: "#78716C",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#5B7FD6",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#dc2626",
};

export const STAGE_COLORS: Record<IdeaStage, string> = {
  spark: "#f59e0b",
  exploring: "#5B7FD6",
  validating: "#8b5cf6",
  ready: "#22c55e",
};

export const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
export const MIN_SESSION_DURATION_MS = 60 * 1000; // 1 minute
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
