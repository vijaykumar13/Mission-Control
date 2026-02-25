import { apiSuccess, apiError } from "@/lib/api-helpers";
import { generateWeeklyDigest } from "@/lib/ai/digest";

export async function POST() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return apiError("OPENAI_API_KEY is not configured", 503);
    }

    const digest = await generateWeeklyDigest();
    return apiSuccess(digest);
  } catch (err) {
    console.error("POST /api/ai/digest error:", err);
    return apiError(
      err instanceof Error ? err.message : "Failed to generate digest",
      500
    );
  }
}
