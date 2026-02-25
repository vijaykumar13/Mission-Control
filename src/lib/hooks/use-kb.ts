"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateKBArticleInput, UpdateKBArticleInput } from "@/lib/validations";

interface KBArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  pinned: boolean;
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

export function useKBArticles(search?: string) {
  const params = new URLSearchParams();
  if (search) params.set("q", search);

  return useQuery({
    queryKey: ["kb", search],
    queryFn: () => apiFetch<KBArticle[]>(`/api/kb?${params}`),
  });
}

export function useKBArticle(id: string) {
  return useQuery({
    queryKey: ["kb", id],
    queryFn: () => apiFetch<KBArticle>(`/api/kb/${id}`),
    enabled: !!id,
  });
}

export function useCreateKBArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateKBArticleInput) =>
      apiFetch<KBArticle>("/api/kb", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kb"] });
    },
  });
}

export function useUpdateKBArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateKBArticleInput & { id: string }) =>
      apiFetch<KBArticle>(`/api/kb/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["kb"] });
      qc.invalidateQueries({ queryKey: ["kb", variables.id] });
    },
  });
}

export function useDeleteKBArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/kb/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kb"] });
    },
  });
}
