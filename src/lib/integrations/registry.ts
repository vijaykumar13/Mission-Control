import { db } from "@/lib/db";
import { integrationConfigs, integrationCache } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { IntegrationAdapter, Provider, SyncResult } from "./types";
import { createId } from "@/lib/utils/id";

/** Central registry that manages all integration adapters */
class IntegrationRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private adapters = new Map<string, IntegrationAdapter<any>>();

  /** Register an adapter */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(adapter: IntegrationAdapter<any>): void {
    this.adapters.set(adapter.provider, adapter);
  }

  /** Get a registered adapter */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAdapter(provider: string): IntegrationAdapter<any> | undefined {
    return this.adapters.get(provider);
  }

  /** Get all registered adapters */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAllAdapters(): IntegrationAdapter<any>[] {
    return Array.from(this.adapters.values());
  }

  /** Get integration config from DB */
  async getConfig(provider: Provider): Promise<{ enabled: boolean; config: Record<string, string> } | null> {
    const [row] = await db
      .select()
      .from(integrationConfigs)
      .where(eq(integrationConfigs.provider, provider));

    if (!row) return null;

    return {
      enabled: row.enabled ?? false,
      config: row.config ? JSON.parse(row.config) : {},
    };
  }

  /** Save or update integration config */
  async saveConfig(provider: Provider, config: Record<string, string>, enabled: boolean): Promise<void> {
    const now = new Date();
    const [existing] = await db
      .select({ id: integrationConfigs.id })
      .from(integrationConfigs)
      .where(eq(integrationConfigs.provider, provider));

    if (existing) {
      await db
        .update(integrationConfigs)
        .set({
          config: JSON.stringify(config),
          enabled,
          updatedAt: now,
        })
        .where(eq(integrationConfigs.id, existing.id));
    } else {
      await db.insert(integrationConfigs).values({
        id: createId(),
        provider,
        enabled,
        config: JSON.stringify(config),
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  /** Test connection for a provider */
  async testConnection(provider: Provider): Promise<{ ok: boolean; error?: string }> {
    const adapter = this.adapters.get(provider);
    if (!adapter) return { ok: false, error: "Adapter not registered" };

    const cfg = await this.getConfig(provider);
    if (!cfg) return { ok: false, error: "Not configured" };

    return adapter.testConnection(cfg.config);
  }

  /** Sync a single provider */
  async syncProvider(provider: Provider): Promise<SyncResult> {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      return { success: false, itemsSynced: 0, error: "Adapter not registered", syncedAt: new Date() };
    }

    const cfg = await this.getConfig(provider);
    if (!cfg || !cfg.enabled) {
      return { success: false, itemsSynced: 0, error: "Not configured or disabled", syncedAt: new Date() };
    }

    const result = await adapter.sync(cfg.config);

    // Update last sync timestamp
    await db
      .update(integrationConfigs)
      .set({ lastSyncAt: result.syncedAt })
      .where(eq(integrationConfigs.provider, provider));

    return result;
  }

  /** Sync all enabled providers */
  async syncAll(): Promise<Record<string, SyncResult>> {
    const configs = await db.select().from(integrationConfigs);
    const results: Record<string, SyncResult> = {};

    for (const cfg of configs) {
      if (!cfg.enabled) continue;
      try {
        results[cfg.provider] = await this.syncProvider(cfg.provider as Provider);
      } catch (err) {
        results[cfg.provider] = {
          success: false,
          itemsSynced: 0,
          error: err instanceof Error ? err.message : "Unknown error",
          syncedAt: new Date(),
        };
      }
    }

    return results;
  }

  /** Get cached data for a provider */
  async getCached<T = unknown>(provider: string, dataType: string): Promise<T | null> {
    const [row] = await db
      .select()
      .from(integrationCache)
      .where(
        and(
          eq(integrationCache.provider, provider),
          eq(integrationCache.dataType, dataType)
        )
      );

    if (!row) return null;

    // Check if cache is expired
    if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
      return null;
    }

    return JSON.parse(row.data) as T;
  }

  /** Set cached data for a provider */
  async setCache(provider: string, dataType: string, data: unknown, ttlMinutes = 5): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    const [existing] = await db
      .select({ id: integrationCache.id })
      .from(integrationCache)
      .where(
        and(
          eq(integrationCache.provider, provider),
          eq(integrationCache.dataType, dataType)
        )
      );

    if (existing) {
      await db
        .update(integrationCache)
        .set({
          data: JSON.stringify(data),
          fetchedAt: now,
          expiresAt,
        })
        .where(eq(integrationCache.id, existing.id));
    } else {
      await db.insert(integrationCache).values({
        id: createId(),
        provider,
        dataType,
        data: JSON.stringify(data),
        fetchedAt: now,
        expiresAt,
      });
    }
  }
}

/** Singleton registry instance */
export const registry = new IntegrationRegistry();
