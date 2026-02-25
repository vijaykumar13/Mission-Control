"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings,
  User,
  Palette,
  Link2,
  Database,
  Brain,
  Bell,
  Shield,
} from "lucide-react";
import { useState } from "react";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "database", label: "Database", icon: Database },
  { id: "ai", label: "AI & Search", icon: Brain },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

type SectionId = (typeof sections)[number]["id"];

function IntegrationCard({
  name,
  description,
  connected,
}: {
  name: string;
  description: string;
  connected: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-[var(--radius-md)] border border-[var(--border-default)]">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{name}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
      </div>
      <Button variant={connected ? "secondary" : "primary"} size="sm">
        {connected ? "Disconnect" : "Connect"}
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("profile");

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
                    defaultValue="Jackie"
                    className="w-full max-w-sm h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                    Timezone
                  </label>
                  <select className="w-full max-w-sm h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]">
                    <option>America/New_York</option>
                    <option>America/Chicago</option>
                    <option>America/Denver</option>
                    <option>America/Los_Angeles</option>
                    <option>UTC</option>
                  </select>
                </div>
                <Button size="sm">Save Changes</Button>
              </div>
            </Card>
          )}

          {activeSection === "appearance" && (
            <Card>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
                Appearance
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    {["Light", "Dark", "System"].map((theme) => (
                      <button
                        key={theme}
                        className="px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                      >
                        {theme}
                      </button>
                    ))}
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
              <div className="space-y-3">
                <IntegrationCard
                  name="Asana"
                  description="Sync projects and tasks from Asana"
                  connected={false}
                />
                <IntegrationCard
                  name="Gmail"
                  description="Surface email highlights on your dashboard"
                  connected={false}
                />
                <IntegrationCard
                  name="Google Calendar"
                  description="View upcoming events and schedule"
                  connected={false}
                />
                <IntegrationCard
                  name="GitHub"
                  description="Track repositories and pull requests"
                  connected={false}
                />
              </div>
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
                    <p className="text-xs text-[var(--text-tertiary)]">Cloud SQLite</p>
                  </div>
                  <span className="text-xs font-medium text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded-full">
                    Not configured
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                    Database URL
                  </label>
                  <input
                    type="text"
                    placeholder="libsql://your-db.turso.io"
                    className="w-full h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                    Auth Token
                  </label>
                  <input
                    type="password"
                    placeholder="Your auth token"
                    className="w-full h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] font-mono"
                  />
                </div>
                <Button size="sm">Test Connection</Button>
              </div>
            </Card>
          )}

          {activeSection === "ai" && (
            <Card>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
                AI & Search
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    className="w-full max-w-md h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] font-mono"
                  />
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Used for embeddings (text-embedding-3-small) and AI features (gpt-4o-mini)
                  </p>
                </div>
                <Button size="sm">Save & Test</Button>
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
