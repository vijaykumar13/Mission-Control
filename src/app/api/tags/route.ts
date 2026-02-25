import { db } from "@/lib/db";
import { tags, tagAssignments } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { createTagSchema, createTagAssignmentSchema } from "@/lib/validations";
import { apiSuccess, apiError, parseBody, ValidationError } from "@/lib/api-helpers";
import { createId } from "@/lib/utils/id";

// GET /api/tags - List all tags with usage counts
export async function GET() {
  try {
    const result = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        count: sql<number>`count(${tagAssignments.id})`.as("count"),
      })
      .from(tags)
      .leftJoin(tagAssignments, eq(tags.id, tagAssignments.tagId))
      .groupBy(tags.id)
      .orderBy(tags.name);

    return apiSuccess(result);
  } catch (err) {
    console.error("GET /api/tags error:", err);
    return apiError("Failed to fetch tags", 500);
  }
}

// POST /api/tags - Create a tag
export async function POST(request: Request) {
  try {
    const data = await parseBody(request, createTagSchema);

    const id = createId();
    await db.insert(tags).values({ id, ...data });

    const [created] = await db.select().from(tags).where(eq(tags.id, id));
    return apiSuccess(created, 201);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("POST /api/tags error:", err);
    return apiError("Failed to create tag", 500);
  }
}
