import { findSimilar } from "@/lib/ai/search";
import { apiSuccess, apiError, parseBody } from "@/lib/api-helpers";
import { z } from "zod";

const similarSchema = z.object({
  entityId: z.string().min(1),
  entityType: z.enum(["project", "task", "idea", "kb_article"]),
  limit: z.number().int().min(1).max(20).default(5),
  threshold: z.number().min(0).max(1).default(0.3),
});

export async function POST(request: Request) {
  try {
    const data = await parseBody(request, similarSchema);

    const results = await findSimilar(data.entityId, data.entityType, {
      limit: data.limit,
      threshold: data.threshold,
    });

    return apiSuccess(results);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "ValidationError") {
      return apiError(err.message);
    }
    if (err instanceof Error && err.message.includes("OPENAI_API_KEY")) {
      return apiError("OpenAI API key not configured", 503);
    }
    console.error("POST /api/ai/similar error:", err);
    return apiError("Find similar failed", 500);
  }
}
