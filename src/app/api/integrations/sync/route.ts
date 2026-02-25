import { registry } from "@/lib/integrations";
import { apiSuccess, apiError, parseBody } from "@/lib/api-helpers";
import { z } from "zod";

const syncSchema = z.object({
  provider: z.enum(["asana", "gmail", "calendar", "github"]).optional(),
});

// POST /api/integrations/sync — sync one or all providers
export async function POST(request: Request) {
  try {
    const data = await parseBody(request, syncSchema);

    if (data.provider) {
      const result = await registry.syncProvider(data.provider);
      return apiSuccess({ [data.provider]: result });
    }

    const results = await registry.syncAll();
    return apiSuccess(results);
  } catch (err) {
    console.error("POST /api/integrations/sync error:", err);
    return apiError("Sync failed", 500);
  }
}
