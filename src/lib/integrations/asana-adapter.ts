import type { IntegrationAdapter, AsanaConfig, SyncResult } from "./types";
import { registry } from "./registry";

const ASANA_API = "https://app.asana.com/api/1.0";

interface AsanaTask {
  gid: string;
  name: string;
  completed: boolean;
  due_on: string | null;
  notes: string;
  assignee: { gid: string; name: string } | null;
  projects: Array<{ gid: string; name: string }>;
}

interface AsanaProject {
  gid: string;
  name: string;
  notes: string;
  color: string;
  current_status: { text: string; color: string } | null;
}

export interface CachedAsanaData {
  projects: Array<{
    id: string;
    name: string;
    notes: string;
    taskCount: number;
  }>;
  tasks: Array<{
    id: string;
    name: string;
    completed: boolean;
    dueOn: string | null;
    projectName: string;
  }>;
}

async function asanaFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${ASANA_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Asana API error (${res.status}): ${text}`);
  }
  const json = await res.json();
  return json.data as T;
}

export const asanaAdapter: IntegrationAdapter<AsanaConfig> = {
  provider: "asana",
  displayName: "Asana",
  description: "Sync projects and tasks from Asana",

  async testConnection(config) {
    try {
      if (!config.accessToken) return { ok: false, error: "Access token required" };
      await asanaFetch<{ gid: string }>("/users/me", config.accessToken);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Connection failed" };
    }
  },

  async sync(config) {
    try {
      if (!config.accessToken) {
        return { success: false, itemsSynced: 0, error: "Access token required", syncedAt: new Date() };
      }

      // Get workspaces
      const workspaces = await asanaFetch<Array<{ gid: string; name: string }>>(
        "/workspaces",
        config.accessToken
      );
      const workspaceId = config.workspaceId || workspaces[0]?.gid;
      if (!workspaceId) {
        return { success: false, itemsSynced: 0, error: "No workspace found", syncedAt: new Date() };
      }

      // Get projects
      const projects = await asanaFetch<AsanaProject[]>(
        `/workspaces/${workspaceId}/projects?opt_fields=name,notes,color,current_status`,
        config.accessToken
      );

      // Get tasks assigned to user
      const tasks = await asanaFetch<AsanaTask[]>(
        `/tasks?assignee=me&workspace=${workspaceId}&opt_fields=name,completed,due_on,notes,projects.name&completed_since=now`,
        config.accessToken
      );

      const cachedData: CachedAsanaData = {
        projects: projects.map((p) => ({
          id: p.gid,
          name: p.name,
          notes: p.notes || "",
          taskCount: 0,
        })),
        tasks: tasks.map((t) => ({
          id: t.gid,
          name: t.name,
          completed: t.completed,
          dueOn: t.due_on,
          projectName: t.projects?.[0]?.name || "No Project",
        })),
      };

      await registry.setCache("asana", "data", cachedData, 5);

      return {
        success: true,
        itemsSynced: projects.length + tasks.length,
        syncedAt: new Date(),
      };
    } catch (err) {
      return {
        success: false,
        itemsSynced: 0,
        error: err instanceof Error ? err.message : "Sync failed",
        syncedAt: new Date(),
      };
    }
  },

  async getCachedData<T>(dataType: string) {
    return registry.getCached<T>("asana", dataType);
  },
};
