import { registry } from "@/lib/integrations";
import { apiSuccess, apiError, getSearchParams } from "@/lib/api-helpers";

// GET /api/integrations/cached?provider=calendar — get cached data for a provider
export async function GET(request: Request) {
  try {
    const params = getSearchParams(request);
    const provider = params.get("provider");

    if (!provider) {
      return apiError("Provider is required", 400);
    }

    const data = await registry.getCached(provider, "data");
    return apiSuccess(data);
  } catch (err) {
    console.error("GET /api/integrations/cached error:", err);
    return apiError("Failed to fetch cached data", 500);
  }
}
