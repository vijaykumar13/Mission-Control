import { semanticSearch } from "@/lib/ai/search";
import { apiSuccess, apiError, parseBody } from "@/lib/api-helpers";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().min(1, "Query is required").max(500),
  limit: z.number().int().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.3),
  entityTypes: z
    .array(z.enum(["project", "task", "idea", "kb_article"]))
    .optional(),
});

export async function POST(request: Request) {
  try {
    const data = await parseBody(request, searchSchema);

    const results = await semanticSearch(data.query, {
      limit: data.limit,
      threshold: data.threshold,
      entityTypes: data.entityTypes,
    });

    return apiSuccess(results);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "ValidationError") {
      return apiError(err.message);
    }
    if (err instanceof Error && err.message.includes("OPENAI_API_KEY")) {
      return apiError("OpenAI API key not configured", 503);
    }
    console.error("POST /api/search error:", err);
    return apiError("Search failed", 500);
  }
}
