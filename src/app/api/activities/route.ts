import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { createActivitySchema } from "@/lib/validations";
import { apiSuccess, apiError, parseBody, getSearchParams, ValidationError } from "@/lib/api-helpers";
import { createId } from "@/lib/utils/id";

// GET /api/activities - List activities
export async function GET(request: Request) {
  try {
    const params = getSearchParams(request);
    const source = params.get("source");
    const limit = parseInt(params.get("limit") || "50", 10);

    const conditions = [];
    if (source && source !== "all") {
      conditions.push(
        eq(activities.source, source as "local" | "asana" | "gmail" | "calendar" | "github")
      );
    }

    const result = await db
      .select()
      .from(activities)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(activities.createdAt))
      .limit(limit);

    return apiSuccess(result);
  } catch (err) {
    console.error("GET /api/activities error:", err);
    return apiError("Failed to fetch activities", 500);
  }
}

// POST /api/activities - Log an activity
export async function POST(request: Request) {
  try {
    const data = await parseBody(request, createActivitySchema);

    const id = createId();
    const now = new Date();

    await db.insert(activities).values({
      id,
      action: data.action,
      title: data.title,
      source: data.source,
      entityId: data.entityId ?? null,
      entityType: data.entityType ?? null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      createdAt: now,
    });

    const [created] = await db.select().from(activities).where(eq(activities.id, id));
    return apiSuccess(created, 201);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("POST /api/activities error:", err);
    return apiError("Failed to log activity", 500);
  }
}
