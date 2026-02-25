import { db } from "@/lib/db";
import { tagAssignments, tags } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createTagAssignmentSchema } from "@/lib/validations";
import { apiSuccess, apiError, parseBody, getSearchParams, ValidationError } from "@/lib/api-helpers";
import { createId } from "@/lib/utils/id";

// GET /api/tag-assignments?entityId=X&entityType=Y
export async function GET(request: Request) {
  try {
    const params = getSearchParams(request);
    const entityId = params.get("entityId");
    const entityType = params.get("entityType");

    if (!entityId || !entityType) {
      return apiError("entityId and entityType are required");
    }

    const result = await db
      .select({
        id: tagAssignments.id,
        tagId: tagAssignments.tagId,
        entityId: tagAssignments.entityId,
        entityType: tagAssignments.entityType,
        tag: {
          id: tags.id,
          name: tags.name,
          color: tags.color,
        },
      })
      .from(tagAssignments)
      .leftJoin(tags, eq(tagAssignments.tagId, tags.id))
      .where(
        and(
          eq(tagAssignments.entityId, entityId),
          eq(tagAssignments.entityType, entityType as "project" | "idea" | "kb_article")
        )
      );

    return apiSuccess(result);
  } catch (err) {
    console.error("GET /api/tag-assignments error:", err);
    return apiError("Failed to fetch tag assignments", 500);
  }
}

// POST /api/tag-assignments
export async function POST(request: Request) {
  try {
    const data = await parseBody(request, createTagAssignmentSchema);
    const id = createId();

    // Check if assignment already exists
    const [existing] = await db
      .select()
      .from(tagAssignments)
      .where(
        and(
          eq(tagAssignments.tagId, data.tagId),
          eq(tagAssignments.entityId, data.entityId),
          eq(tagAssignments.entityType, data.entityType)
        )
      );

    if (existing) {
      return apiError("Tag is already assigned to this entity");
    }

    await db.insert(tagAssignments).values({
      id,
      tagId: data.tagId,
      entityId: data.entityId,
      entityType: data.entityType,
    });

    const [created] = await db.select().from(tagAssignments).where(eq(tagAssignments.id, id));
    return apiSuccess(created, 201);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("POST /api/tag-assignments error:", err);
    return apiError("Failed to create tag assignment", 500);
  }
}

// DELETE /api/tag-assignments?id=X
export async function DELETE(request: Request) {
  try {
    const params = getSearchParams(request);
    const id = params.get("id");
    const tagId = params.get("tagId");
    const entityId = params.get("entityId");

    if (id) {
      const [existing] = await db.select().from(tagAssignments).where(eq(tagAssignments.id, id));
      if (!existing) return apiError("Assignment not found", 404);
      await db.delete(tagAssignments).where(eq(tagAssignments.id, id));
    } else if (tagId && entityId) {
      await db.delete(tagAssignments).where(
        and(
          eq(tagAssignments.tagId, tagId),
          eq(tagAssignments.entityId, entityId)
        )
      );
    } else {
      return apiError("Provide either id or tagId+entityId");
    }

    return apiSuccess({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/tag-assignments error:", err);
    return apiError("Failed to delete tag assignment", 500);
  }
}
