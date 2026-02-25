import { db } from "@/lib/db";
import { integrationConfigs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { registry } from "@/lib/integrations";
import { apiSuccess, apiError, parseBody } from "@/lib/api-helpers";
import { z } from "zod";

// GET /api/integrations/config — list all integration configs
export async function GET() {
  try {
    const configs = await db.select().from(integrationConfigs);
    const adapters = registry.getAllAdapters();

    const result = adapters.map((adapter) => {
      const cfg = configs.find((c) => c.provider === adapter.provider);
      return {
        provider: adapter.provider,
        displayName: adapter.displayName,
        description: adapter.description,
        enabled: cfg?.enabled ?? false,
        configured: !!cfg?.config,
        lastSyncAt: cfg?.lastSyncAt ?? null,
      };
    });

    return apiSuccess(result);
  } catch (err) {
    console.error("GET /api/integrations/config error:", err);
    return apiError("Failed to fetch integration configs", 500);
  }
}

const saveConfigSchema = z.object({
  provider: z.enum(["asana", "gmail", "calendar", "github"]),
  config: z.record(z.string(), z.string()),
  enabled: z.boolean().default(true),
});

// POST /api/integrations/config — save integration config
export async function POST(request: Request) {
  try {
    const data = await parseBody(request, saveConfigSchema);
    await registry.saveConfig(data.provider, data.config, data.enabled);
    return apiSuccess({ saved: true });
  } catch (err) {
    console.error("POST /api/integrations/config error:", err);
    return apiError("Failed to save config", 500);
  }
}
