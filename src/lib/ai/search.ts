import { db } from "@/lib/db";
import { embeddings, projects, tasks, ideas, kbArticles } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { generateEmbedding, type EntityType } from "./embeddings";

export interface SearchResult {
  entityId: string;
  entityType: EntityType;
  score: number;
  title: string;
  description: string | null;
  href: string;
}

/** Compute cosine similarity between two vectors */
function cosineSimilarity(a: number[], b: number[]): number {
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

/** Semantic search across all entities */
export async function semanticSearch(
  query: string,
  options: {
    limit?: number;
    threshold?: number;
    entityTypes?: EntityType[];
  } = {}
): Promise<SearchResult[]> {
  const { limit = 10, threshold = 0.3, entityTypes } = options;

  // Generate query embedding
  const queryVector = await generateEmbedding(query);

  // Fetch all embeddings (filtered by type if specified)
  let allEmbeddings;
  if (entityTypes && entityTypes.length > 0) {
    allEmbeddings = await db
      .select()
      .from(embeddings)
      .where(inArray(embeddings.entityType, entityTypes));
  } else {
    allEmbeddings = await db.select().from(embeddings);
  }

  // Score each embedding
  const scored = allEmbeddings
    .map((emb) => ({
      entityId: emb.entityId,
      entityType: emb.entityType as EntityType,
      score: cosineSimilarity(queryVector, JSON.parse(emb.vector)),
    }))
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Hydrate results with entity data
  return hydrateResults(scored);
}

/** Find entities similar to a given entity */
export async function findSimilar(
  entityId: string,
  entityType: EntityType,
  options: { limit?: number; threshold?: number } = {}
): Promise<SearchResult[]> {
  const { limit = 5, threshold = 0.3 } = options;

  // Get the source embedding
  const [source] = await db
    .select()
    .from(embeddings)
    .where(eq(embeddings.entityId, entityId));

  if (!source) return [];

  const sourceVector: number[] = JSON.parse(source.vector);

  // Get all other embeddings
  const allEmbeddings = await db.select().from(embeddings);

  const scored = allEmbeddings
    .filter((emb) => emb.entityId !== entityId)
    .map((emb) => ({
      entityId: emb.entityId,
      entityType: emb.entityType as EntityType,
      score: cosineSimilarity(sourceVector, JSON.parse(emb.vector)),
    }))
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return hydrateResults(scored);
}

/** Hydrate scored results with entity titles and URLs */
async function hydrateResults(
  scored: { entityId: string; entityType: EntityType; score: number }[]
): Promise<SearchResult[]> {
  if (scored.length === 0) return [];

  // Group by entity type
  const byType = new Map<EntityType, string[]>();
  for (const r of scored) {
    const ids = byType.get(r.entityType) || [];
    ids.push(r.entityId);
    byType.set(r.entityType, ids);
  }

  // Fetch entity data
  const entityMap = new Map<string, { title: string; description: string | null; href: string }>();

  const projectIds = byType.get("project");
  if (projectIds?.length) {
    const rows = await db.select().from(projects).where(inArray(projects.id, projectIds));
    for (const r of rows) {
      entityMap.set(r.id, { title: r.title, description: r.description, href: `/projects/${r.id}` });
    }
  }

  const taskIds = byType.get("task");
  if (taskIds?.length) {
    const rows = await db.select().from(tasks).where(inArray(tasks.id, taskIds));
    for (const r of rows) {
      entityMap.set(r.id, { title: r.title, description: r.description, href: `/projects/${r.projectId}` });
    }
  }

  const ideaIds = byType.get("idea");
  if (ideaIds?.length) {
    const rows = await db.select().from(ideas).where(inArray(ideas.id, ideaIds));
    for (const r of rows) {
      entityMap.set(r.id, { title: r.title, description: r.body, href: "/ideas" });
    }
  }

  const articleIds = byType.get("kb_article");
  if (articleIds?.length) {
    const rows = await db.select().from(kbArticles).where(inArray(kbArticles.id, articleIds));
    for (const r of rows) {
      entityMap.set(r.id, { title: r.title, description: r.summary, href: `/kb/${r.id}` });
    }
  }

  return scored
    .map((r) => {
      const entity = entityMap.get(r.entityId);
      if (!entity) return null;
      return { ...r, ...entity };
    })
    .filter((r): r is SearchResult => r !== null);
}
