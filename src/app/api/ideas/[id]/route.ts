import { db } from "@/lib/db";
import { ideas } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateIdeaSchema } from "@/lib/validations";
import { apiSuccess, apiError, parseBody, ValidationError } from "@/lib/api-helpers";
import { buildEmbeddingContent, embedInBackground, deleteEmbedding } from "@/lib/ai/embeddings";

// GET /api/ideas/:id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
    if (!idea) return apiError("Idea not found", 404);
    return apiSuccess(idea);
  } catch (err) {
    console.error("GET /api/ideas/:id error:", err);
    return apiError("Failed to fetch idea", 500);
  }
}

// PATCH /api/ideas/:id
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await parseBody(request, updateIdeaSchema);

    const [existing] = await db.select().from(ideas).where(eq(ideas.id, id));
    if (!existing) return apiError("Idea not found", 404);

    await db.update(ideas).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(ideas.id, id));

    const [updated] = await db.select().from(ideas).where(eq(ideas.id, id));

    // Re-embed on update
    if (data.title || data.body !== undefined) {
      const content = buildEmbeddingContent("idea", { title: updated.title, body: updated.body });
      embedInBackground(id, "idea", content);
    }

    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("PATCH /api/ideas/:id error:", err);
    return apiError("Failed to update idea", 500);
  }
}

// DELETE /api/ideas/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [existing] = await db.select().from(ideas).where(eq(ideas.id, id));
    if (!existing) return apiError("Idea not found", 404);

    await db.delete(ideas).where(eq(ideas.id, id));
    deleteEmbedding(id, "idea").catch(() => {});
    return apiSuccess({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/ideas/:id error:", err);
    return apiError("Failed to delete idea", 500);
  }
}
