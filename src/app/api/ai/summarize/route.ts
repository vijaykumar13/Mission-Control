import { z } from "zod";
import { apiSuccess, apiError, parseBody, ValidationError } from "@/lib/api-helpers";
import { summarizeArticle } from "@/lib/ai/digest";

const schema = z.object({
  articleId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return apiError("OPENAI_API_KEY is not configured", 503);
    }

    const data = await parseBody(request, schema);
    const summary = await summarizeArticle(data.articleId);

    return apiSuccess({ summary });
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("POST /api/ai/summarize error:", err);
    return apiError(
      err instanceof Error ? err.message : "Failed to summarize",
      500
    );
  }
}
