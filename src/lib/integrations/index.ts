import { registry } from "./registry";
import { asanaAdapter } from "./asana-adapter";
import { calendarAdapter } from "./calendar-adapter";
import { gmailAdapter } from "./gmail-adapter";

// Register all adapters
registry.register(asanaAdapter);
registry.register(calendarAdapter);
registry.register(gmailAdapter);

export { registry } from "./registry";
export type { Provider, SyncResult, IntegrationAdapter } from "./types";
export type { CachedAsanaData } from "./asana-adapter";
export type { CachedCalendarData, CalendarEvent } from "./calendar-adapter";
export type { CachedGmailData, EmailMessage } from "./gmail-adapter";
