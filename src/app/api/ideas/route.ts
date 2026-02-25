import { db } from "@/lib/db";
import { ideas } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { createIdeaSchema } from "@/lib/validations";
import { apiSuccess, apiError, parseBody, getSearchParams, ValidationError } from "@/lib/api-helpers";
import { createId } from "@/lib/utils/id";
import { buildEmbeddingContent, embedInBackground } from "@/lib/ai/embeddings";

// GET /api/ideas - List ideas
export async function GET(request: Request) {
  try {
    const params = getSearchParams(request);
    const stage = params.get("stage");

    const conditions = [];
    if (stage) {
      conditions.push(eq(ideas.stage, stage as "spark" | "exploring" | "validating" | "ready"));
    }

    const result = await db
      .select()
      .from(ideas)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(ideas.updatedAt));

    return apiSuccess(result);
  } catch (err) {
    console.error("GET /api/ideas error:", err);
    return apiError("Failed to fetch ideas", 500);
  }
}

// POST /api/ideas - Create an idea
export async function POST(request: Request) {
  try {
    const data = await parseBody(request, createIdeaSchema);

    const now = new Date();
    const id = createId();

    const newIdea = {
      id,
      ...data,
      projectId: data.projectId || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(ideas).values(newIdea);

    const [created] = await db.select().from(ideas).where(eq(ideas.id, id));

    // Auto-embed
    const content = buildEmbeddingContent("idea", { title: data.title, body: data.body });
    embedInBackground(id, "idea", content);

    return apiSuccess(created, 201);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("POST /api/ideas error:", err);
    return apiError("Failed to create idea", 500);
  }
}
