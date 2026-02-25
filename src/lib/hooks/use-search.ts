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

/** Tag suggestion result */
export interface TagSuggestion {
  tagId: string;
  name: string;
  color: string;
  confidence: number;
  reason: string;
}

/** Suggest tags for content */
export function useSuggestTags(content: string, options?: { entityId?: string; entityType?: string; enabled?: boolean }) {
  return useQuery({
    queryKey: ["suggest-tags", content.slice(0, 100), options?.entityId],
    queryFn: () =>
      apiFetch<TagSuggestion[]>("/api/ai/suggest-tags", {
        method: "POST",
        body: JSON.stringify({
          content,
          entityId: options?.entityId,
          entityType: options?.entityType,
          limit: 5,
        }),
      }),
    enabled: (options?.enabled ?? true) && content.trim().length >= 5,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/** Smart capture result */
export interface SmartCaptureResult {
  id: string;
  type: string;
  title: string;
  href: string;
  parsed: {
    type: string;
    title: string;
    priority?: string;
    stage?: string;
    dueDate?: string;
  };
}

/** Smart capture mutation */
export function useSmartCapture() {
  return useMutation({
    mutationFn: (data: { input: string; projectId?: string }) =>
      apiFetch<SmartCaptureResult>("/api/ai/smart-capture", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
