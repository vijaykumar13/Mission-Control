"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Square, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/stores/app-store";
import { useProjects } from "@/lib/hooks/use-projects";
import {
  useCreateTimeSession,
  useUpdateTimeSession,
} from "@/lib/hooks/use-time-sessions";

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TimerWidget() {
  const {
    timer,
    startTimer,
    stopTimer,
    tickTimer,
  } = useAppStore();
  const { data: projects } = useProjects();
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const createSession = useCreateTimeSession();
  const updateSession = useUpdateTimeSession();

  // Track the API session ID separately from the Zustand store's session ID.
  // This ref holds the server-side session ID returned by the create mutation.
  const apiSessionIdRef = useRef<string | null>(null);

  // On mount, if Zustand says a timer is running (persisted from before refresh),
  // recalculate elapsed from the persisted startedAt timestamp.
  useEffect(() => {
    if (timer.isRunning && timer.startedAt) {
      const now = Date.now();
      const recalculated = Math.floor((now - timer.startedAt) / 1000);
      if (Math.abs(recalculated - timer.elapsed) > 2) {
        tickTimer();
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick the timer every second
  useEffect(() => {
    if (!timer.isRunning) return;
    const interval = setInterval(tickTimer, 1000);
    return () => clearInterval(interval);
  }, [timer.isRunning, tickTimer]);

  const handleStartStop = useCallback(() => {
    if (timer.isRunning) {
      // Stop: persist the session to the API
      const now = new Date();
      const durationMinutes = timer.startedAt
        ? Math.round((now.getTime() - timer.startedAt) / 60000)
        : 0;

      const sessionId = apiSessionIdRef.current || timer.activeSessionId;
      if (sessionId) {
        updateSession.mutate({
          id: sessionId,
          endedAt: now.toISOString(),
          duration: durationMinutes > 0 ? durationMinutes : 1,
        });
      }
      apiSessionIdRef.current = null;
      stopTimer();
    } else {
      if (projects && projects.length > 0) {
        setShowProjectPicker(true);
      } else {
        handleStartWithProject();
      }
    }
  }, [timer.isRunning, timer.startedAt, timer.activeSessionId, stopTimer, projects, updateSession]);

  const handleStartWithProject = useCallback(
    (projectId?: string) => {
      const startedAt = new Date().toISOString();

      // Create the session in the API
      createSession.mutate(
        {
          projectId: projectId || null,
          type: "auto",
          startedAt,
        },
        {
          onSuccess: (created) => {
            // Store the API-returned session ID so we can PATCH it on stop
            apiSessionIdRef.current = created.id;
          },
        }
      );

      // Start the local Zustand timer immediately for responsive UI
      startTimer(projectId);
      setShowProjectPicker(false);
    },
    [createSession, startTimer]
  );

  const activeProject = projects?.find((p) => p.id === timer.activeProjectId);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {timer.isRunning && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-md)] bg-[var(--accent-50)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] animate-pulse" />
            <span className="text-xs font-mono font-semibold text-[var(--accent-600)]">
              {formatElapsed(timer.elapsed)}
            </span>
            {activeProject && (
              <span className="text-xs text-[var(--accent-500)] truncate max-w-[100px]">
                {activeProject.title}
              </span>
            )}
          </div>
        )}
        <button
          onClick={handleStartStop}
          className={`p-2 rounded-[var(--radius-md)] cursor-pointer transition-colors ${
            timer.isRunning
              ? "hover:bg-red-50 text-[var(--danger)]"
              : "hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
          }`}
          title={timer.isRunning ? "Stop timer" : "Start timer"}
        >
          {timer.isRunning ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Project picker dropdown */}
      {showProjectPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowProjectPicker(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-60 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] z-50 py-1">
            <p className="px-3 py-1.5 text-xs font-medium text-[var(--text-tertiary)]">
              Start timer for:
            </p>
            <button
              onClick={() => handleStartWithProject()}
              className="w-full text-left px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
            >
              No project (general)
            </button>
            {projects?.map((project) => (
              <button
                key={project.id}
                onClick={() => handleStartWithProject(project.id)}
                className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] cursor-pointer flex items-center gap-2"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate">{project.title}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
