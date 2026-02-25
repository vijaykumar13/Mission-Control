import { registry } from "@/lib/integrations";
import { apiSuccess, apiError, parseBody } from "@/lib/api-helpers";
import { z } from "zod";

const testSchema = z.object({
  provider: z.enum(["asana", "gmail", "calendar", "github"]),
});

// POST /api/integrations/test — test connection
export async function POST(request: Request) {
  try {
    const { provider } = await parseBody(request, testSchema);
    const result = await registry.testConnection(provider);
    return apiSuccess(result);
  } catch (err) {
    console.error("POST /api/integrations/test error:", err);
    return apiError("Test failed", 500);
  }
}
