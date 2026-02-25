"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validations";

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | null;
  dueDate: string | null;
  completedDate: string | null;
  sortOrder: number;
  externalId: string | null;
  externalSource: string | null;
  createdAt: string;
  updatedAt: string;
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

export function useTasks(projectId?: string) {
  const params = new URLSearchParams();
  if (projectId) params.set("projectId", projectId);

  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => apiFetch<Task[]>(`/api/tasks?${params}`),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["tasks", "detail", id],
    queryFn: () => apiFetch<Task>(`/api/tasks/${id}`),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskInput) =>
      apiFetch<Task>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["tasks", variables.projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] }); // Update task counts
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTaskInput & { id: string }) =>
      apiFetch<Task>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
