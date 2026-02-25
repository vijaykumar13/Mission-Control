/**
 * Smart Capture — NLP-style parsing to detect entity type and extract
 * structured data from natural language input.
 *
 * Patterns:
 * - "task: ..." or "todo: ..." → task
 * - "idea: ..." or "what if ..." → idea
 * - "note: ..." or "kb: ..." → kb_article
 * - Default → idea (spark stage)
 *
 * Also detects:
 * - Priority: "high priority", "p1", "urgent", "!!" → high
 * - Due dates: "by friday", "due tomorrow", "next week"
 */

export interface CaptureResult {
  type: "task" | "idea" | "kb_article";
  title: string;
  priority?: "low" | "medium" | "high";
  stage?: "spark" | "exploring" | "validating" | "ready";
  dueDate?: string; // ISO date string
  projectHint?: string; // guessed project name from context
}

const TASK_PREFIXES = /^(task|todo|fix|bug|implement|build|add|create|update|refactor|test)\s*[:\-–—]\s*/i;
const IDEA_PREFIXES = /^(idea|what if|how about|maybe|consider|explore)\s*[:\-–—]?\s*/i;
const NOTE_PREFIXES = /^(note|kb|article|doc|document|write up|reference)\s*[:\-–—]\s*/i;

const PRIORITY_HIGH = /\b(high\s*priority|urgent|critical|p1|asap|!!)\b/i;
const PRIORITY_LOW = /\b(low\s*priority|minor|p3|nice\s*to\s*have|someday)\b/i;

const DUE_TOMORROW = /\b(due\s+)?tomorrow\b/i;
const DUE_NEXT_WEEK = /\b(due\s+)?next\s+week\b/i;
const DUE_TODAY = /\b(due\s+)?today\b/i;
const DUE_BY_DAY = /\bby\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;

export function parseCapture(input: string): CaptureResult {
  let text = input.trim();
  let type: CaptureResult["type"] = "idea";
  let priority: CaptureResult["priority"];
  let stage: CaptureResult["stage"] = "spark";
  let dueDate: string | undefined;

  // Detect entity type from prefix
  if (TASK_PREFIXES.test(text)) {
    type = "task";
    text = text.replace(TASK_PREFIXES, "");
  } else if (NOTE_PREFIXES.test(text)) {
    type = "kb_article";
    text = text.replace(NOTE_PREFIXES, "");
  } else if (IDEA_PREFIXES.test(text)) {
    type = "idea";
    text = text.replace(IDEA_PREFIXES, "");
  }

  // Detect priority
  if (PRIORITY_HIGH.test(text)) {
    priority = "high";
    text = text.replace(PRIORITY_HIGH, "").trim();
  } else if (PRIORITY_LOW.test(text)) {
    priority = "low";
    text = text.replace(PRIORITY_LOW, "").trim();
  }

  // Detect due dates
  if (DUE_TODAY.test(text)) {
    dueDate = new Date().toISOString().split("T")[0];
    text = text.replace(DUE_TODAY, "").trim();
  } else if (DUE_TOMORROW.test(text)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    dueDate = d.toISOString().split("T")[0];
    text = text.replace(DUE_TOMORROW, "").trim();
  } else if (DUE_NEXT_WEEK.test(text)) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    dueDate = d.toISOString().split("T")[0];
    text = text.replace(DUE_NEXT_WEEK, "").trim();
  } else if (DUE_BY_DAY.test(text)) {
    const match = text.match(DUE_BY_DAY);
    if (match) {
      dueDate = getNextDayOfWeek(match[1]).toISOString().split("T")[0];
      text = text.replace(DUE_BY_DAY, "").trim();
    }
  }

  // Clean up trailing/leading punctuation and whitespace
  text = text.replace(/^[\s,\-–—:]+|[\s,\-–—:]+$/g, "").trim();

  // If after prefix stripping it's just "task" / "idea" etc, keep original
  if (text.length < 2) {
    text = input.trim();
  }

  // Capitalize first letter
  text = text.charAt(0).toUpperCase() + text.slice(1);

  return {
    type,
    title: text,
    ...(priority && { priority }),
    ...(type === "idea" && { stage }),
    ...(dueDate && { dueDate }),
  };
}

function getNextDayOfWeek(dayName: string): Date {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const targetDay = days.indexOf(dayName.toLowerCase());
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  const result = new Date(today);
  result.setDate(today.getDate() + daysUntil);
  return result;
}
