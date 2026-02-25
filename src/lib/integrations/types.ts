/** Result of syncing an integration */
export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  error?: string;
  syncedAt: Date;
}

/** Base integration adapter interface */
export interface IntegrationAdapter<TConfig = Record<string, string>> {
  /** Unique provider identifier */
  provider: string;
  /** Human-readable name */
  displayName: string;
  /** Description of what this integration does */
  description: string;
  /** Test if the integration's credentials are valid */
  testConnection(config: TConfig): Promise<{ ok: boolean; error?: string }>;
  /** Sync data from the external service */
  sync(config: TConfig): Promise<SyncResult>;
  /** Get cached data of a specific type */
  getCachedData<T = unknown>(dataType: string): Promise<T | null>;
}

/** Supported integration providers */
export type Provider = "asana" | "gmail" | "calendar" | "github";

/** Shape of config stored in DB for each provider */
export interface AsanaConfig {
  accessToken: string;
  workspaceId?: string;
}

export interface GmailConfig {
  accessToken: string;
  refreshToken?: string;
}

export interface CalendarConfig {
  accessToken: string;
  refreshToken?: string;
  calendarId?: string;
}

export interface GitHubConfig {
  accessToken: string;
  username?: string;
}
