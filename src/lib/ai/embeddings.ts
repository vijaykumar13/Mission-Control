import { db } from "@/lib/db";
import { embeddings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@/lib/utils/id";

const OPENAI_API_URL = "https://api.openai.com/v1/embeddings";
const MODEL = "text-embedding-3-small";
const DIMENSIONS = 1536;

export type EntityType = "project" | "task" | "idea" | "kb_article";

/** Call OpenAI embeddings API to convert text into a vector */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  // Truncate to ~8000 tokens (~32000 chars) to stay within model limits
  const truncated = text.slice(0, 32000);

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: truncated,
      model: MODEL,
      dimensions: DIMENSIONS,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${error}`);
  }

  const json = await res.json();
  return json.data[0].embedding as number[];
}

/** Build a text representation of an entity for embedding */
export function buildEmbeddingContent(
  entityType: EntityType,
  data: { title: string; description?: string | null; body?: string | null; content?: string | null; summary?: string | null }
): string {
  const parts = [data.title];

  if (data.description) parts.push(data.description);
  if (data.body) parts.push(data.body);
  if (data.content) parts.push(data.content);
  if (data.summary) parts.push(data.summary);

  return parts.join("\n\n");
}

/** Store or update an embedding for an entity */
export async function upsertEmbedding(
  entityId: string,
  entityType: EntityType,
  content: string
): Promise<void> {
  const vector = await generateEmbedding(content);
  const now = new Date();

  // Check if embedding already exists
  const [existing] = await db
    .select({ id: embeddings.id })
    .from(embeddings)
    .where(and(eq(embeddings.entityId, entityId), eq(embeddings.entityType, entityType)));

  if (existing) {
    await db
      .update(embeddings)
      .set({
        vector: JSON.stringify(vector),
        content,
        updatedAt: now,
      })
      .where(eq(embeddings.id, existing.id));
  } else {
    await db.insert(embeddings).values({
      id: createId(),
      entityId,
      entityType,
      vector: JSON.stringify(vector),
      content,
      model: MODEL,
      createdAt: now,
      updatedAt: now,
    });
  }
}

/** Delete embedding for an entity */
export async function deleteEmbedding(entityId: string, entityType: EntityType): Promise<void> {
  await db
    .delete(embeddings)
    .where(and(eq(embeddings.entityId, entityId), eq(embeddings.entityType, entityType)));
}

/** Trigger embedding in background (fire-and-forget, logs errors) */
export function embedInBackground(
  entityId: string,
  entityType: EntityType,
  content: string
): void {
  upsertEmbedding(entityId, entityType, content).catch((err) => {
    console.error(`Failed to embed ${entityType}/${entityId}:`, err);
  });
}
