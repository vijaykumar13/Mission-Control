"use client";

import { useQuery, useMutation } from "@tanstack/react-query";

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

// ── Chat ──────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  sources: { type: string; title: string; href: string }[];
}

export function useAIChat() {
  return useMutation({
    mutationFn: (messages: ChatMessage[]) =>
      apiFetch<ChatResponse>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ messages }),
      }),
  });
}

// ── Weekly Digest ─────────────────────────────────────────

export interface WeeklyDigest {
  summary: string;
  highlights: string[];
  suggestions: string[];
  stats: {
    tasksCompleted: number;
    tasksCreated: number;
    ideasCreated: number;
    articlesWritten: number;
    activeProjects: number;
  };
  generatedAt: string;
}

export function useWeeklyDigest() {
  return useMutation({
    mutationFn: () =>
      apiFetch<WeeklyDigest>("/api/ai/digest", {
        method: "POST",
      }),
  });
}

// ── Summarize ─────────────────────────────────────────────

export function useSummarizeArticle() {
  return useMutation({
    mutationFn: (articleId: string) =>
      apiFetch<{ summary: string }>("/api/ai/summarize", {
        method: "POST",
        body: JSON.stringify({ articleId }),
      }),
  });
}
