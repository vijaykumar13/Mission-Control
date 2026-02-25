import { db } from "@/lib/db";
import { timeSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateTimeSessionSchema } from "@/lib/validations";
import { apiSuccess, apiError, parseBody, ValidationError } from "@/lib/api-helpers";

// PATCH /api/time-sessions/:id - Update (usually to end a session)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await parseBody(request, updateTimeSessionSchema);

    const [existing] = await db.select().from(timeSessions).where(eq(timeSessions.id, id));
    if (!existing) return apiError("Time session not found", 404);

    const updateData: Record<string, unknown> = {};

    if (data.endedAt !== undefined) {
      updateData.endedAt = data.endedAt ? new Date(data.endedAt) : null;
    }
    if (data.duration !== undefined) {
      updateData.duration = data.duration;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    await db.update(timeSessions).set(updateData).where(eq(timeSessions.id, id));
    const [updated] = await db.select().from(timeSessions).where(eq(timeSessions.id, id));
    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("PATCH /api/time-sessions/:id error:", err);
    return apiError("Failed to update time session", 500);
  }
}

// DELETE /api/time-sessions/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [existing] = await db.select().from(timeSessions).where(eq(timeSessions.id, id));
    if (!existing) return apiError("Time session not found", 404);

    await db.delete(timeSessions).where(eq(timeSessions.id, id));
    return apiSuccess({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/time-sessions/:id error:", err);
    return apiError("Failed to delete time session", 500);
  }
}
