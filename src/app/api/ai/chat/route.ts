import { z } from "zod";
import { apiSuccess, apiError, parseBody, ValidationError } from "@/lib/api-helpers";
import { chat, type ChatMessage } from "@/lib/ai/chat";

const schema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(5000),
    })
  ).min(1).max(50),
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return apiError("OPENAI_API_KEY is not configured", 503);
    }

    const data = await parseBody(request, schema);
    const result = await chat(data.messages as ChatMessage[]);

    return apiSuccess(result);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("POST /api/ai/chat error:", err);
    return apiError(
      err instanceof Error ? err.message : "Failed to generate chat response",
      500
    );
  }
}
