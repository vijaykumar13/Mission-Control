import { db } from "@/lib/db";
import { timeSessions } from "@/lib/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { createTimeSessionSchema } from "@/lib/validations";
import { apiSuccess, apiError, parseBody, getSearchParams, ValidationError } from "@/lib/api-helpers";
import { createId } from "@/lib/utils/id";

// GET /api/time-sessions - List time sessions
export async function GET(request: Request) {
  try {
    const params = getSearchParams(request);
    const projectId = params.get("projectId");
    const from = params.get("from");
    const to = params.get("to");

    const conditions = [];
    if (projectId) {
      conditions.push(eq(timeSessions.projectId, projectId));
    }
    if (from) {
      conditions.push(gte(timeSessions.startedAt, new Date(from)));
    }
    if (to) {
      conditions.push(lte(timeSessions.startedAt, new Date(to)));
    }

    const result = await db
      .select()
      .from(timeSessions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(timeSessions.startedAt));

    return apiSuccess(result);
  } catch (err) {
    console.error("GET /api/time-sessions error:", err);
    return apiError("Failed to fetch time sessions", 500);
  }
}

// POST /api/time-sessions - Create a time session
export async function POST(request: Request) {
  try {
    const data = await parseBody(request, createTimeSessionSchema);

    const id = createId();
    const now = new Date();

    await db.insert(timeSessions).values({
      id,
      projectId: data.projectId || null,
      taskId: data.taskId || null,
      type: data.type,
      startedAt: new Date(data.startedAt),
      endedAt: data.endedAt ? new Date(data.endedAt) : null,
      duration: data.duration || null,
      notes: data.notes || null,
      createdAt: now,
    });

    const [created] = await db.select().from(timeSessions).where(eq(timeSessions.id, id));
    return apiSuccess(created, 201);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("POST /api/time-sessions error:", err);
    return apiError("Failed to create time session", 500);
  }
}
