"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Palette,
  Link2,
  Database,
  Brain,
  Bell,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "@/lib/stores/toast-store";
import {
  useIntegrations,
  useSaveIntegrationConfig,
  useTestIntegration,
  useSyncIntegration,
} from "@/lib/hooks/use-integrations";
import { useAppStore } from "@/lib/stores/app-store";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "database", label: "Database", icon: Database },
  { id: "ai", label: "AI & Search", icon: Brain },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

type SectionId = (typeof sections)[number]["id"];

// ── Integration Config Card ─────────────────────────────

function IntegrationConfigCard({
  provider,
  displayName,
  description,
  enabled,
  configured,
  lastSyncAt,
}: {
  provider: string;
  displayName: string;
  description: string;
  enabled: boolean;
  configured: boolean;
  lastSyncAt: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  const saveConfig = useSaveIntegrationConfig();
  const testConnection = useTestIntegration();
  const syncIntegration = useSyncIntegration();

  const handleSave = useCallback(async () => {
    if (!token.trim()) return;
    try {
      await saveConfig.mutateAsync({
        provider,
        config: { accessToken: token },
        enabled: true,
      });
      setShowForm(false);
      setToken("");
      setTestResult(null);
    } catch {
      // handled by mutation
    }
  }, [provider, token, saveConfig]);

  const handleTest = useCallback(async () => {
    // Save first, then test
    if (token.trim()) {
      await saveConfig.mutateAsync({
        provider,
        config: { accessToken: token },
        enabled: true,
      });
    }
    const result = await testConnection.mutateAsync(provider);
    setTestResult(result);
  }, [provider, token, saveConfig, testConnection]);

  const handleSync = useCallback(async () => {
    await syncIntegration.mutateAsync(provider);
  }, [provider, syncIntegration]);

  const handleDisconnect = useCallback(async () => {
    await saveConfig.mutateAsync({
      provider,
      config: {},
      enabled: false,
    });
    setTestResult(null);
  }, [provider, saveConfig]);

  return (
    <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border-default)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--text-primary)]">{displayName}</p>
          {configured && enabled ? (
            <Badge variant="success" size="sm">Connected</Badge>
          ) : (
            <Badge variant="default" size="sm">Not connected</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {configured && enabled && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={syncIntegration.isPending}
              >
                {syncIntegration.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Sync
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={saveConfig.isPending}>
                Disconnect
              </Button>
            </>
          )}
          {!configured || !enabled ? (
            <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Connect"}
            </Button>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-[var(--text-secondary)] mb-1">{description}</p>

      {lastSyncAt && (
        <p className="text-[10px] text-[var(--text-tertiary)]">
          Last synced: {new Date(lastSyncAt).toLocaleString()}
        </p>
      )}

      {/* Test result */}
      {testResult && (
        <div className={`flex items-center gap-1.5 mt-2 text-xs ${testResult.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
          {testResult.ok ? (
            <><CheckCircle2 className="w-3.5 h-3.5" /> Connection successful</>
          ) : (
            <><XCircle className="w-3.5 h-3.5" /> {testResult.error || "Connection failed"}</>
          )}
        </div>
      )}

      {/* Config form */}
      {showForm && (
        <div className="mt-3 pt-3 border-t border-[var(--border-default)] space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
              Access Token
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={`Paste your ${displayName} access token`}
                className="w-full h-9 px-3 pr-9 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!token.trim() || saveConfig.isPending}
            >
              {saveConfig.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save & Connect"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTest}
              disabled={!token.trim() || testConnection.isPending}
            >
              {testConnection.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Test Connection"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Settings Page ───────────────────────────────────

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const { data: integrations, isLoading: integrationsLoading } = useIntegrations();
  const { displayName, setDisplayName, timezone, setTimezone, ui: { theme }, setTheme } = useAppStore();
  const [nameInput, setNameInput] = useState(displayName);
  const [tzInput, setTzInput] = useState(timezone);

  return (
    <PageShell title="Settings" description="Configure your Mission Control">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Nav */}
        <div className="lg:col-span-1">
          <Card padding="sm">
            <nav className="space-y-0.5">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-colors cursor-pointer ${
                    activeSection === section.id
                      ? "bg-[var(--accent-50)] text-[var(--accent-500)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-4">
          {activeSection === "profile" && (
            <Card>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
                Profile
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full max-w-sm h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                    Timezone
                  </label>
                  <select
                    value={tzInput}
                    onChange={(e) => setTzInput(e.target.value)}
                    className="w-full max-w-sm h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] cursor-pointer"
                  >
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Chicago">America/Chicago</option>
                    <option value="America/Denver">America/Denver</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Europe/Berlin">Europe/Berlin</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setDisplayName(nameInput);
                    setTimezone(tzInput);
                    toast.success("Settings saved", "Your profile has been updated.");
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </Card>
          )}

          {activeSection === "appearance" && (
            <Card>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
                Appearance
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] border cursor-pointer transition-colors ${
                          theme === t
                            ? "border-[var(--accent-500)] bg-[var(--accent-50)] text-[var(--accent-600)]"
                            : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                    Keyboard Shortcuts
                  </label>
                  <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center justify-between py-1">
                      <span>Search / Command Palette</span>
                      <kbd className="px-1.5 py-0.5 bg-[var(--gray-100)] border border-[var(--border-default)] rounded text-[10px] font-mono">Cmd+K</kbd>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span>Toggle Sidebar</span>
                      <kbd className="px-1.5 py-0.5 bg-[var(--gray-100)] border border-[var(--border-default)] rounded text-[10px] font-mono">Cmd+/</kbd>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span>Toggle Dark Mode</span>
                      <kbd className="px-1.5 py-0.5 bg-[var(--gray-100)] border border-[var(--border-default)] rounded text-[10px] font-mono">Shift+D</kbd>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span>Go to Page</span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-[var(--gray-100)] border border-[var(--border-default)] rounded text-[10px] font-mono">G</kbd>
                        <span className="text-[var(--text-tertiary)]">then</span>
                        <kbd className="px-1.5 py-0.5 bg-[var(--gray-100)] border border-[var(--border-default)] rounded text-[10px] font-mono">D/P/I/B/A/N/S</kbd>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeSection === "integrations" && (
            <Card>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
                Integrations
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Connect external services to pull data into your dashboard.
              </p>
              {integrationsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-[var(--radius-md)] bg-[var(--gray-50)] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {integrations?.map((integration) => (
                    <IntegrationConfigCard
                      key={integration.provider}
                      {...integration}
                    />
                  ))}
                  {/* GitHub placeholder */}
                  <div className="p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">GitHub</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Track repositories and pull requests</p>
                      </div>
                      <Badge variant="default" size="sm">Coming Soon</Badge>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {activeSection === "database" && (
            <Card>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
                Database
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--gray-50)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Turso DB</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Cloud SQLite via Drizzle ORM</p>
                  </div>
                  <Badge variant="info" size="sm">Configured via ENV</Badge>
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Database credentials are managed through environment variables (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN).
                  Set them in your Vercel project settings or .env.local file.
                </p>
              </div>
            </Card>
          )}

          {activeSection === "ai" && (
            <Card>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
                AI & Search
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--gray-50)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">OpenAI</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Embeddings & AI features</p>
                  </div>
                  <Badge variant="info" size="sm">Configured via ENV</Badge>
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Set OPENAI_API_KEY in your environment variables. Used for semantic search (text-embedding-3-small)
                  and upcoming AI features (gpt-4o-mini).
                </p>
                <div className="pt-2">
                  <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Features</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                      <span className="text-[var(--text-secondary)]">Semantic search across all content</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                      <span className="text-[var(--text-secondary)]">Find similar items</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                      <span className="text-[var(--text-secondary)]">Auto-embed on create/update</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
                Notifications
              </h3>
              <p className="text-sm text-[var(--text-tertiary)]">
                Notification preferences will be available once integrations are connected.
              </p>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
