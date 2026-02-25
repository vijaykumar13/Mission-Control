"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateTimeSessionInput, UpdateTimeSessionInput } from "@/lib/validations";

interface TimeSession {
  id: string;
  projectId: string | null;
  taskId: string | null;
  type: "auto" | "manual" | "logged";
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  notes: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  data: T;
  error: string | null;
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const json: ApiResponse<T> = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export function useTimeSessions(projectId?: string) {
  const params = new URLSearchParams();
  if (projectId) params.set("projectId", projectId);

  return useQuery({
    queryKey: ["time-sessions", projectId],
    queryFn: () => apiFetch<TimeSession[]>(`/api/time-sessions?${params}`),
  });
}

export function useCreateTimeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimeSessionInput) =>
      apiFetch<TimeSession>("/api/time-sessions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-sessions"] });
    },
  });
}

export function useUpdateTimeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTimeSessionInput & { id: string }) =>
      apiFetch<TimeSession>(`/api/time-sessions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-sessions"] });
    },
  });
}

export function useDeleteTimeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/time-sessions/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-sessions"] });
    },
  });
}
