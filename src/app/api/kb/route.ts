import { db } from "@/lib/db";
import { kbArticles } from "@/lib/db/schema";
import { eq, desc, like, and } from "drizzle-orm";
import { createKBArticleSchema } from "@/lib/validations";
import { apiSuccess, apiError, parseBody, getSearchParams, ValidationError } from "@/lib/api-helpers";
import { createId } from "@/lib/utils/id";
import { slugify } from "@/lib/utils/id";
import { buildEmbeddingContent, embedInBackground } from "@/lib/ai/embeddings";

// GET /api/kb - List articles
export async function GET(request: Request) {
  try {
    const params = getSearchParams(request);
    const search = params.get("q");

    const conditions = [];
    if (search) {
      conditions.push(like(kbArticles.title, `%${search}%`));
    }

    const result = await db
      .select()
      .from(kbArticles)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(kbArticles.updatedAt));

    return apiSuccess(result);
  } catch (err) {
    console.error("GET /api/kb error:", err);
    return apiError("Failed to fetch articles", 500);
  }
}

// POST /api/kb - Create an article
export async function POST(request: Request) {
  try {
    const data = await parseBody(request, createKBArticleSchema);

    const now = new Date();
    const id = createId();
    const baseSlug = slugify(data.title);

    // Make slug unique
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const [existing] = await db
        .select({ id: kbArticles.id })
        .from(kbArticles)
        .where(eq(kbArticles.slug, slug));
      if (!existing) break;
      slug = `${baseSlug}-${counter++}`;
    }

    const newArticle = {
      id,
      ...data,
      slug,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(kbArticles).values(newArticle);

    const [created] = await db.select().from(kbArticles).where(eq(kbArticles.id, id));

    // Auto-embed
    const content = buildEmbeddingContent("kb_article", { title: data.title, content: data.content, summary: data.summary });
    embedInBackground(id, "kb_article", content);

    return apiSuccess(created, 201);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("POST /api/kb error:", err);
    return apiError("Failed to create article", 500);
  }
}
