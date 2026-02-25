import { db } from "@/lib/db";
import { tags, tagAssignments } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";

interface TagSuggestion {
  tagId: string;
  name: string;
  color: string;
  confidence: number;
  reason: string;
}

/**
 * Suggest tags for an entity based on content similarity with
 * other entities that share the same tags.
 *
 * How it works:
 * 1. Generate embedding for the content
 * 2. For each existing tag, find entities tagged with it
 * 3. Compare content similarity to those entities
 * 4. Rank tags by average similarity score
 */
export async function suggestTags(
  content: string,
  options: {
    entityId?: string;
    entityType?: string;
    limit?: number;
  } = {}
): Promise<TagSuggestion[]> {
  const { entityId, limit = 5 } = options;

  // Get all tags
  const allTags = await db.select().from(tags);
  if (allTags.length === 0) return [];

  // Get all tag assignments
  const allAssignments = await db.select().from(tagAssignments);
  if (allAssignments.length === 0) {
    // No assignments yet — suggest based on keyword matching
    return keywordSuggest(content, allTags, limit);
  }

  // Build map: tagId -> entity IDs
  const tagEntityMap = new Map<string, string[]>();
  for (const a of allAssignments) {
    // Skip self-assignments
    if (entityId && a.entityId === entityId) continue;
    const ids = tagEntityMap.get(a.tagId) || [];
    ids.push(a.entityId);
    tagEntityMap.set(a.tagId, ids);
  }

  // Get already-assigned tags for this entity (to exclude them)
  const assignedTagIds = new Set<string>();
  if (entityId) {
    const current = allAssignments.filter((a) => a.entityId === entityId);
    for (const a of current) {
      assignedTagIds.add(a.tagId);
    }
  }

  // Get embeddings for all entities that have tag assignments
  const allEntityIds = [...new Set(Array.from(tagEntityMap.values()).flat())];
  if (allEntityIds.length === 0) {
    return keywordSuggest(content, allTags, limit);
  }

  // Generate embedding for the content
  let contentVector: number[];
  try {
    contentVector = await generateEmbedding(content);
  } catch {
    // If OpenAI unavailable, fall back to keyword matching
    return keywordSuggest(content, allTags, limit);
  }

  // Get embeddings for tagged entities
  const { embeddings: embeddingsTable } = await import("@/lib/db/schema");
  const entityEmbeddings = await db
    .select()
    .from(embeddingsTable)
    .where(inArray(embeddingsTable.entityId, allEntityIds));

  const embeddingMap = new Map<string, number[]>();
  for (const e of entityEmbeddings) {
    embeddingMap.set(e.entityId, JSON.parse(e.vector));
  }

  // Score each tag
  const suggestions: TagSuggestion[] = [];

  for (const tag of allTags) {
    // Skip already assigned
    if (assignedTagIds.has(tag.id)) continue;

    const entityIds = tagEntityMap.get(tag.id);
    if (!entityIds?.length) continue;

    // Compute average similarity to entities with this tag
    let totalSim = 0;
    let count = 0;

    for (const eid of entityIds) {
      const vec = embeddingMap.get(eid);
      if (!vec) continue;
      totalSim += cosineSim(contentVector, vec);
      count++;
    }

    if (count === 0) continue;

    const avgSim = totalSim / count;
    if (avgSim >= 0.25) {
      suggestions.push({
        tagId: tag.id,
        name: tag.name ?? "",
        color: tag.color ?? "#5B7FD6",
        confidence: Math.round(avgSim * 100) / 100,
        reason: `Similar to ${count} ${count === 1 ? "item" : "items"} with this tag`,
      });
    }
  }

  // Sort by confidence descending
  suggestions.sort((a, b) => b.confidence - a.confidence);

  // If we didn't get enough from embedding similarity, supplement with keyword matches
  if (suggestions.length < limit) {
    const keywordMatches = keywordSuggest(content, allTags, limit - suggestions.length);
    const existingIds = new Set(suggestions.map((s) => s.tagId));
    for (const km of keywordMatches) {
      if (!existingIds.has(km.tagId) && !assignedTagIds.has(km.tagId)) {
        suggestions.push(km);
      }
    }
  }

  return suggestions.slice(0, limit);
}

/** Simple keyword-based tag suggestion */
function keywordSuggest(
  content: string,
  allTags: { id: string; name: string | null; color: string | null }[],
  limit: number
): TagSuggestion[] {
  const lower = content.toLowerCase();
  const matches: TagSuggestion[] = [];

  for (const tag of allTags) {
    const tagName = (tag.name ?? "").toLowerCase();
    if (tagName && lower.includes(tagName)) {
      matches.push({
        tagId: tag.id,
        name: tag.name ?? "",
        color: tag.color ?? "#5B7FD6",
        confidence: 0.6,
        reason: "Keyword match in content",
      });
    }
  }

  return matches.slice(0, limit);
}

/** Cosine similarity between two vectors */
function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
