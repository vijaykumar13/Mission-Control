"use client";

import { useQuery, useMutation } from "@tanstack/react-query";

export interface SearchResult {
  entityId: string;
  entityType: "project" | "task" | "idea" | "kb_article";
  score: number;
  title: string;
  description: string | null;
  href: string;
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

/** Semantic search hook — triggers on query change with debounce */
export function useSemanticSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["semantic-search", query],
    queryFn: () =>
      apiFetch<SearchResult[]>("/api/search", {
        method: "POST",
        body: JSON.stringify({ query, limit: 10 }),
      }),
    enabled: (options?.enabled ?? true) && query.trim().length >= 2,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

/** Find similar entities */
export function useFindSimilar(entityId: string, entityType: string) {
  return useQuery({
    queryKey: ["find-similar", entityId, entityType],
    queryFn: () =>
      apiFetch<SearchResult[]>("/api/ai/similar", {
        method: "POST",
        body: JSON.stringify({ entityId, entityType, limit: 5 }),
      }),
    enabled: !!entityId && !!entityType,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/** Manual embed trigger */
export function useEmbed() {
  return useMutation({
    mutationFn: (data: { entityId: string; entityType: string }) =>
      apiFetch<{ embedded: boolean }>("/api/ai/embed", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
