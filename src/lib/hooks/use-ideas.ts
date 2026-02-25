"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateIdeaInput, UpdateIdeaInput } from "@/lib/validations";

interface Idea {
  id: string;
  title: string;
  body: string | null;
  stage: "spark" | "exploring" | "validating" | "ready";
  category: string | null;
  projectId: string | null;
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

export function useIdeas(stage?: string) {
  const params = new URLSearchParams();
  if (stage) params.set("stage", stage);

  return useQuery({
    queryKey: ["ideas", stage],
    queryFn: () => apiFetch<Idea[]>(`/api/ideas?${params}`),
  });
}

export function useIdea(id: string) {
  return useQuery({
    queryKey: ["ideas", id],
    queryFn: () => apiFetch<Idea>(`/api/ideas/${id}`),
    enabled: !!id,
  });
}

export function useCreateIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIdeaInput) =>
      apiFetch<Idea>("/api/ideas", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}

export function useUpdateIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateIdeaInput & { id: string }) =>
      apiFetch<Idea>(`/api/ideas/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}

export function useDeleteIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/ideas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}
