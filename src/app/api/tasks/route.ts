import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, desc, and, asc } from "drizzle-orm";
import { createTaskSchema } from "@/lib/validations";
import { apiSuccess, apiError, parseBody, getSearchParams, ValidationError } from "@/lib/api-helpers";
import { createId } from "@/lib/utils/id";
import { buildEmbeddingContent, embedInBackground } from "@/lib/ai/embeddings";

// GET /api/tasks?projectId=xxx - List tasks (optionally filtered by project)
export async function GET(request: Request) {
  try {
    const params = getSearchParams(request);
    const projectId = params.get("projectId");
    const status = params.get("status");

    const conditions = [];
    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    }
    if (status) {
      conditions.push(eq(tasks.status, status as "todo" | "in_progress" | "done"));
    }

    const result = await db
      .select()
      .from(tasks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(tasks.sortOrder), desc(tasks.createdAt));

    return apiSuccess(result);
  } catch (err) {
    console.error("GET /api/tasks error:", err);
    return apiError("Failed to fetch tasks", 500);
  }
}

// POST /api/tasks - Create a task
export async function POST(request: Request) {
  try {
    const data = await parseBody(request, createTaskSchema);

    const now = new Date();
    const id = createId();

    const newTask = {
      id,
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      completedDate: null,
      externalId: null,
      externalSource: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(tasks).values(newTask);

    const [created] = await db.select().from(tasks).where(eq(tasks.id, id));

    // Auto-embed
    const content = buildEmbeddingContent("task", { title: data.title, description: data.description });
    embedInBackground(id, "task", content);

    return apiSuccess(created, 201);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("POST /api/tasks error:", err);
    return apiError("Failed to create task", 500);
  }
}
