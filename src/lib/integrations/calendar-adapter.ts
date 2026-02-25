import type { IntegrationAdapter, CalendarConfig, SyncResult } from "./types";
import { registry } from "./registry";

const GCAL_API = "https://www.googleapis.com/calendar/v3";

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string; // ISO datetime
  end: string;
  location?: string;
  htmlLink: string;
  status: string;
  organizer?: string;
}

export interface CachedCalendarData {
  events: CalendarEvent[];
  lastFetched: string;
}

async function calendarFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GCAL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar API error (${res.status}): ${text}`);
  }
  return res.json();
}

export const calendarAdapter: IntegrationAdapter<CalendarConfig> = {
  provider: "calendar",
  displayName: "Google Calendar",
  description: "View upcoming events and schedule",

  async testConnection(config) {
    try {
      if (!config.accessToken) return { ok: false, error: "Access token required" };
      await calendarFetch<unknown>("/users/me/calendarList?maxResults=1", config.accessToken);
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

      const calendarId = config.calendarId || "primary";
      const now = new Date();
      const timeMin = now.toISOString();
      // Fetch events for next 7 days
      const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const data = await calendarFetch<{
        items: Array<{
          id: string;
          summary: string;
          description?: string;
          start: { dateTime?: string; date?: string };
          end: { dateTime?: string; date?: string };
          location?: string;
          htmlLink: string;
          status: string;
          organizer?: { displayName?: string; email: string };
        }>;
      }>(
        `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=20&singleEvents=true&orderBy=startTime`,
        config.accessToken
      );

      const events: CalendarEvent[] = (data.items || []).map((e) => ({
        id: e.id,
        summary: e.summary || "Untitled Event",
        description: e.description,
        start: e.start.dateTime || e.start.date || "",
        end: e.end.dateTime || e.end.date || "",
        location: e.location,
        htmlLink: e.htmlLink,
        status: e.status,
        organizer: e.organizer?.displayName || e.organizer?.email,
      }));

      const cached: CachedCalendarData = {
        events,
        lastFetched: new Date().toISOString(),
      };

      await registry.setCache("calendar", "data", cached, 5);

      return {
        success: true,
        itemsSynced: events.length,
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
    return registry.getCached<T>("calendar", dataType);
  },
};
