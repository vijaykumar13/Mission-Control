import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateTaskSchema } from "@/lib/validations";
import { apiSuccess, apiError, parseBody, ValidationError } from "@/lib/api-helpers";
import { buildEmbeddingContent, embedInBackground, deleteEmbedding } from "@/lib/ai/embeddings";

// GET /api/tasks/:id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!task) return apiError("Task not found", 404);
    return apiSuccess(task);
  } catch (err) {
    console.error("GET /api/tasks/:id error:", err);
    return apiError("Failed to fetch task", 500);
  }
}

// PATCH /api/tasks/:id
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await parseBody(request, updateTaskSchema);

    const [existing] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!existing) return apiError("Task not found", 404);

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    // Auto-set completedDate
    if (data.status === "done" && existing.status !== "done") {
      updateData.completedDate = new Date();
    } else if (data.status && data.status !== "done") {
      updateData.completedDate = null;
    }

    await db.update(tasks).set(updateData).where(eq(tasks.id, id));
    const [updated] = await db.select().from(tasks).where(eq(tasks.id, id));

    // Re-embed on update
    if (data.title || data.description !== undefined) {
      const content = buildEmbeddingContent("task", { title: updated.title, description: updated.description });
      embedInBackground(id, "task", content);
    }

    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("PATCH /api/tasks/:id error:", err);
    return apiError("Failed to update task", 500);
  }
}

// DELETE /api/tasks/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [existing] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!existing) return apiError("Task not found", 404);

    await db.delete(tasks).where(eq(tasks.id, id));
    deleteEmbedding(id, "task").catch(() => {});
    return apiSuccess({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/tasks/:id error:", err);
    return apiError("Failed to delete task", 500);
  }
}
