"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

export interface IntegrationStatus {
  provider: string;
  displayName: string;
  description: string;
  enabled: boolean;
  configured: boolean;
  lastSyncAt: string | null;
}

/** Get all integration configs/statuses */
export function useIntegrations() {
  return useQuery({
    queryKey: ["integrations"],
    queryFn: () => apiFetch<IntegrationStatus[]>("/api/integrations/config"),
  });
}

/** Save integration config */
export function useSaveIntegrationConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { provider: string; config: Record<string, string>; enabled: boolean }) =>
      apiFetch<{ saved: boolean }>("/api/integrations/config", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
}

/** Test integration connection */
export function useTestIntegration() {
  return useMutation({
    mutationFn: (provider: string) =>
      apiFetch<{ ok: boolean; error?: string }>("/api/integrations/test", {
        method: "POST",
        body: JSON.stringify({ provider }),
      }),
  });
}

/** Get cached data for a provider */
export function useCachedIntegration<T>(provider: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["integration-cached", provider],
    queryFn: () => apiFetch<T | null>(`/api/integrations/cached?provider=${provider}`),
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
  });
}

/** Sync integration */
export function useSyncIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider?: string) =>
      apiFetch<Record<string, unknown>>("/api/integrations/sync", {
        method: "POST",
        body: JSON.stringify({ provider }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
}
