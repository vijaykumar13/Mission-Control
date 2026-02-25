import { db } from "@/lib/db";
import { projects, tasks, ideas, kbArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildEmbeddingContent, upsertEmbedding, type EntityType } from "@/lib/ai/embeddings";
import { apiSuccess, apiError, parseBody } from "@/lib/api-helpers";
import { z } from "zod";

const embedSchema = z.object({
  entityId: z.string().min(1),
  entityType: z.enum(["project", "task", "idea", "kb_article"]),
});

export async function POST(request: Request) {
  try {
    const { entityId, entityType } = await parseBody(request, embedSchema);

    // Fetch entity data
    const entity = await fetchEntity(entityId, entityType);
    if (!entity) {
      return apiError("Entity not found", 404);
    }

    const content = buildEmbeddingContent(entityType, entity);
    await upsertEmbedding(entityId, entityType, content);

    return apiSuccess({ entityId, entityType, embedded: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "ValidationError") {
      return apiError(err.message);
    }
    if (err instanceof Error && err.message.includes("OPENAI_API_KEY")) {
      return apiError("OpenAI API key not configured", 503);
    }
    console.error("POST /api/ai/embed error:", err);
    return apiError("Embedding failed", 500);
  }
}

async function fetchEntity(
  entityId: string,
  entityType: EntityType
): Promise<{ title: string; description?: string | null; body?: string | null; content?: string | null; summary?: string | null } | null> {
  switch (entityType) {
    case "project": {
      const [row] = await db.select().from(projects).where(eq(projects.id, entityId));
      return row ? { title: row.title, description: row.description } : null;
    }
    case "task": {
      const [row] = await db.select().from(tasks).where(eq(tasks.id, entityId));
      return row ? { title: row.title, description: row.description } : null;
    }
    case "idea": {
      const [row] = await db.select().from(ideas).where(eq(ideas.id, entityId));
      return row ? { title: row.title, body: row.body } : null;
    }
    case "kb_article": {
      const [row] = await db.select().from(kbArticles).where(eq(kbArticles.id, entityId));
      return row ? { title: row.title, content: row.content, summary: row.summary } : null;
    }
    default:
      return null;
  }
}
