import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProjectStatus, IdeaStage, Priority } from "@/lib/utils/constants";

// ── Types ──────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  color: string;
  externalId: string | null;
  externalSource: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: Priority;
  dueDate: number | null;
  completedAt: number | null;
  externalId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Idea {
  id: string;
  title: string;
  body: string | null;
  stage: IdeaStage;
  projectId: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TimeSession {
  id: string;
  projectId: string | null;
  taskId: string | null;
  type: "auto" | "manual" | "logged";
  startedAt: number;
  endedAt: number | null;
  duration: number | null;
  notes: string | null;
}

// ── Timer State ────────────────────────────────────────

interface TimerState {
  isRunning: boolean;
  activeSessionId: string | null;
  activeProjectId: string | null;
  activeTaskId: string | null;
  startedAt: number | null;
  elapsed: number; // seconds
}

// ── UI State ───────────────────────────────────────────

interface UIState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  quickCaptureOpen: boolean;
  theme: "light" | "dark" | "system";
}

// ── App Store ──────────────────────────────────────────

interface AppState {
  // UI
  ui: UIState;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickCaptureOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Timer
  timer: TimerState;
  startTimer: (projectId?: string, taskId?: string) => void;
  stopTimer: () => void;
  tickTimer: () => void;

  // User preferences
  displayName: string;
  setDisplayName: (name: string) => void;
  timezone: string;
  setTimezone: (tz: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── UI ──
      ui: {
        sidebarCollapsed: false,
        commandPaletteOpen: false,
        quickCaptureOpen: false,
        theme: "light",
      },
      toggleSidebar: () =>
        set((state) => ({
          ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed },
        })),
      setCommandPaletteOpen: (open) =>
        set((state) => ({ ui: { ...state.ui, commandPaletteOpen: open } })),
      setQuickCaptureOpen: (open) =>
        set((state) => ({ ui: { ...state.ui, quickCaptureOpen: open } })),
      setTheme: (theme) =>
        set((state) => ({ ui: { ...state.ui, theme } })),

      // ── Timer ──
      timer: {
        isRunning: false,
        activeSessionId: null,
        activeProjectId: null,
        activeTaskId: null,
        startedAt: null,
        elapsed: 0,
      },
      startTimer: (projectId, taskId) =>
        set({
          timer: {
            isRunning: true,
            activeSessionId: crypto.randomUUID(),
            activeProjectId: projectId || null,
            activeTaskId: taskId || null,
            startedAt: Date.now(),
            elapsed: 0,
          },
        }),
      stopTimer: () =>
        set({
          timer: {
            isRunning: false,
            activeSessionId: null,
            activeProjectId: null,
            activeTaskId: null,
            startedAt: null,
            elapsed: 0,
          },
        }),
      tickTimer: () =>
        set((state) => {
          if (!state.timer.isRunning || !state.timer.startedAt) return state;
          return {
            timer: {
              ...state.timer,
              elapsed: Math.floor((Date.now() - state.timer.startedAt) / 1000),
            },
          };
        }),

      // ── User ──
      displayName: "Jackie",
      setDisplayName: (name) => set({ displayName: name }),
      timezone: "America/New_York",
      setTimezone: (tz) => set({ timezone: tz }),
    }),
    {
      name: "mission-control-store",
      partialize: (state) => ({
        ui: { sidebarCollapsed: state.ui.sidebarCollapsed, theme: state.ui.theme },
        displayName: state.displayName,
        timezone: state.timezone,
        timer: state.timer,
      }),
    }
  )
);
