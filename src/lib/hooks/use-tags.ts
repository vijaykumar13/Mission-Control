"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateTagInput } from "@/lib/validations";

interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  usageCount?: number;
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

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => apiFetch<Tag[]>("/api/tags"),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTagInput) =>
      apiFetch<Tag>("/api/tags", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useEntityTags(entityId: string, entityType: string) {
  return useQuery({
    queryKey: ["tag-assignments", entityId, entityType],
    queryFn: () =>
      apiFetch<Array<{
        id: string;
        tagId: string;
        entityId: string;
        entityType: string;
        tag: { id: string; name: string; color: string };
      }>>(`/api/tag-assignments?entityId=${entityId}&entityType=${entityType}`),
    enabled: !!entityId && !!entityType,
  });
}

export function useAssignTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { tagId: string; entityId: string; entityType: string }) =>
      apiFetch<unknown>("/api/tag-assignments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ["tag-assignments", variables.entityId, variables.entityType],
      });
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useRemoveTagAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id?: string; tagId?: string; entityId?: string }) => {
      const searchParams = new URLSearchParams();
      if (params.id) searchParams.set("id", params.id);
      if (params.tagId) searchParams.set("tagId", params.tagId);
      if (params.entityId) searchParams.set("entityId", params.entityId);
      return apiFetch<{ deleted: boolean }>(`/api/tag-assignments?${searchParams}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tag-assignments"] });
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}
