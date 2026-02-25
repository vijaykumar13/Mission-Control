import { z } from "zod";
import { apiSuccess, apiError, parseBody, ValidationError } from "@/lib/api-helpers";
import { suggestTags } from "@/lib/ai/suggest-tags";

const schema = z.object({
  content: z.string().min(1).max(32000),
  entityId: z.string().optional(),
  entityType: z.enum(["project", "idea", "kb_article"]).optional(),
  limit: z.number().int().min(1).max(10).default(5),
});

export async function POST(request: Request) {
  try {
    const data = await parseBody(request, schema);

    const suggestions = await suggestTags(data.content, {
      entityId: data.entityId,
      entityType: data.entityType,
      limit: data.limit,
    });

    return apiSuccess(suggestions);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("POST /api/ai/suggest-tags error:", err);
    return apiError("Failed to suggest tags", 500);
  }
}
