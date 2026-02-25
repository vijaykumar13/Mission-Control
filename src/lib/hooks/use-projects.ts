"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/validations";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "paused" | "completed" | "archived";
  priority: "low" | "medium" | "high" | "critical" | null;
  color: string;
  startDate: string | null;
  targetDate: string | null;
  completedDate: string | null;
  externalId: string | null;
  externalSource: string | null;
  createdAt: string;
  updatedAt: string;
  taskStats?: { total: number; done: number };
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

// ── Queries ────────────────────────────────────────────

export function useProjects(status?: string) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);

  return useQuery({
    queryKey: ["projects", status],
    queryFn: () => apiFetch<Project[]>(`/api/projects?${params}`),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => apiFetch<Project>(`/api/projects/${id}`),
    enabled: !!id,
  });
}

// ── Mutations ──────────────────────────────────────────

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectInput) =>
      apiFetch<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateProjectInput & { id: string }) =>
      apiFetch<Project>(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projects", variables.id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
