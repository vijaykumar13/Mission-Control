import { db } from "@/lib/db";
import { kbArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateKBArticleSchema } from "@/lib/validations";
import { apiSuccess, apiError, parseBody, ValidationError } from "@/lib/api-helpers";
import { slugify } from "@/lib/utils/id";
import { buildEmbeddingContent, embedInBackground, deleteEmbedding } from "@/lib/ai/embeddings";

// GET /api/kb/:id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [article] = await db.select().from(kbArticles).where(eq(kbArticles.id, id));
    if (!article) return apiError("Article not found", 404);
    return apiSuccess(article);
  } catch (err) {
    console.error("GET /api/kb/:id error:", err);
    return apiError("Failed to fetch article", 500);
  }
}

// PATCH /api/kb/:id
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await parseBody(request, updateKBArticleSchema);

    const [existing] = await db.select().from(kbArticles).where(eq(kbArticles.id, id));
    if (!existing) return apiError("Article not found", 404);

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    // Regenerate slug if title changes
    if (data.title && data.title !== existing.title) {
      const baseSlug = slugify(data.title);
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const [dup] = await db
          .select({ id: kbArticles.id })
          .from(kbArticles)
          .where(eq(kbArticles.slug, slug));
        if (!dup || dup.id === id) break;
        slug = `${baseSlug}-${counter++}`;
      }
      updateData.slug = slug;
    }

    await db.update(kbArticles).set(updateData).where(eq(kbArticles.id, id));
    const [updated] = await db.select().from(kbArticles).where(eq(kbArticles.id, id));

    // Re-embed on update
    if (data.title || data.content !== undefined || data.summary !== undefined) {
      const content = buildEmbeddingContent("kb_article", { title: updated.title, content: updated.content, summary: updated.summary });
      embedInBackground(id, "kb_article", content);
    }

    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("PATCH /api/kb/:id error:", err);
    return apiError("Failed to update article", 500);
  }
}

// DELETE /api/kb/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [existing] = await db.select().from(kbArticles).where(eq(kbArticles.id, id));
    if (!existing) return apiError("Article not found", 404);

    await db.delete(kbArticles).where(eq(kbArticles.id, id));
    deleteEmbedding(id, "kb_article").catch(() => {});
    return apiSuccess({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/kb/:id error:", err);
    return apiError("Failed to delete article", 500);
  }
}
