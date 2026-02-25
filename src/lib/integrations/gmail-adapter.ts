import type { IntegrationAdapter, GmailConfig, SyncResult } from "./types";
import { registry } from "./registry";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string; // ISO datetime
  unread: boolean;
  labels: string[];
}

export interface CachedGmailData {
  messages: EmailMessage[];
  unreadCount: number;
  lastFetched: string;
}

async function gmailFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail API error (${res.status}): ${text}`);
  }
  return res.json();
}

function extractHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

export const gmailAdapter: IntegrationAdapter<GmailConfig> = {
  provider: "gmail",
  displayName: "Gmail",
  description: "Surface email highlights on your dashboard",

  async testConnection(config) {
    try {
      if (!config.accessToken) return { ok: false, error: "Access token required" };
      await gmailFetch<unknown>("/users/me/profile", config.accessToken);
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

      // Get recent messages
      const listData = await gmailFetch<{
        messages: Array<{ id: string; threadId: string }>;
        resultSizeEstimate: number;
      }>("/users/me/messages?maxResults=10&q=is:inbox", config.accessToken);

      const messages: EmailMessage[] = [];

      for (const msg of listData.messages || []) {
        const detail = await gmailFetch<{
          id: string;
          threadId: string;
          snippet: string;
          labelIds: string[];
          payload: { headers: Array<{ name: string; value: string }> };
          internalDate: string;
        }>(`/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, config.accessToken);

        messages.push({
          id: detail.id,
          threadId: detail.threadId,
          subject: extractHeader(detail.payload.headers, "Subject") || "(no subject)",
          from: extractHeader(detail.payload.headers, "From"),
          snippet: detail.snippet,
          date: new Date(parseInt(detail.internalDate)).toISOString(),
          unread: detail.labelIds?.includes("UNREAD") || false,
          labels: detail.labelIds || [],
        });
      }

      const cached: CachedGmailData = {
        messages,
        unreadCount: messages.filter((m) => m.unread).length,
        lastFetched: new Date().toISOString(),
      };

      await registry.setCache("gmail", "data", cached, 5);

      return {
        success: true,
        itemsSynced: messages.length,
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
    return registry.getCached<T>("gmail", dataType);
  },
};
