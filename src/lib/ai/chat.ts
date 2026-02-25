import { db } from "@/lib/db";
import { projects, tasks, ideas, kbArticles, embeddings } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  message: string;
  sources: { type: string; title: string; href: string }[];
}

/** Cosine similarity between two vectors */
function cosineSim(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Retrieve context from the database using RAG */
async function retrieveContext(query: string, limit = 5): Promise<{ content: string; entityId: string; entityType: string }[]> {
  try {
    const queryVector = await generateEmbedding(query);
    const allEmbeddings = await db.select().from(embeddings);

    const scored = allEmbeddings
      .map((emb) => ({
        entityId: emb.entityId,
        entityType: emb.entityType,
        content: emb.content,
        score: cosineSim(queryVector, JSON.parse(emb.vector)),
      }))
      .filter((r) => r.score >= 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  } catch {
    // If embedding fails, return empty context
    return [];
  }
}

/** Get a summary of current workspace state */
async function getWorkspaceSummary(): Promise<string> {
  const [allProjects, allTasks, allIdeas, allArticles] = await Promise.all([
    db.select().from(projects).orderBy(desc(projects.updatedAt)),
    db.select().from(tasks).orderBy(desc(tasks.updatedAt)),
    db.select().from(ideas).orderBy(desc(ideas.updatedAt)),
    db.select().from(kbArticles).orderBy(desc(kbArticles.updatedAt)),
  ]);

  const activeProjects = allProjects.filter((p) => p.status === "active");
  const pendingTasks = allTasks.filter((t) => t.status !== "done");
  const doneTasks = allTasks.filter((t) => t.status === "done");

  const lines = [
    `Workspace summary:`,
    `- ${activeProjects.length} active projects, ${allProjects.length} total`,
    `- ${pendingTasks.length} pending tasks, ${doneTasks.length} completed`,
    `- ${allIdeas.length} ideas`,
    `- ${allArticles.length} knowledge base articles`,
    ``,
    `Active projects: ${activeProjects.slice(0, 5).map((p) => p.title).join(", ") || "None"}`,
    `Recent tasks: ${pendingTasks.slice(0, 5).map((t) => t.title).join(", ") || "None"}`,
    `Recent ideas: ${allIdeas.slice(0, 5).map((i) => i.title).join(", ") || "None"}`,
  ];

  return lines.join("\n");
}

/** Chat with RAG context from workspace data */
export async function chat(
  messages: ChatMessage[],
  options: { includeWorkspaceSummary?: boolean } = {}
): Promise<ChatResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const lastUserMessage = messages.filter((m) => m.role === "user").pop();
  if (!lastUserMessage) throw new Error("No user message provided");

  // Retrieve relevant context via RAG
  const ragResults = await retrieveContext(lastUserMessage.content);

  // Build context string
  let contextStr = "";

  if (options.includeWorkspaceSummary || messages.length <= 1) {
    const summary = await getWorkspaceSummary();
    contextStr += summary + "\n\n";
  }

  if (ragResults.length > 0) {
    contextStr += "Relevant data from your workspace:\n\n";
    for (const r of ragResults) {
      contextStr += `[${r.entityType}] ${r.content.slice(0, 500)}\n\n`;
    }
  }

  // Build sources for attribution
  const sources = await hydrateSources(ragResults);

  const systemMessage: ChatMessage = {
    role: "system",
    content: `You are an AI assistant for a personal command center called Mission Control. You have access to the user's projects, tasks, ideas, and knowledge base articles.

Answer questions about their data, provide insights, and help them be more productive. Be concise and helpful. Reference specific items when relevant.

${contextStr}`,
  };

  const res = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${error}`);
  }

  const json = await res.json();
  const reply = json.choices[0]?.message?.content || "I couldn't generate a response.";

  return { message: reply, sources };
}

/** Hydrate RAG results into source links */
async function hydrateSources(
  results: { entityId: string; entityType: string }[]
): Promise<{ type: string; title: string; href: string }[]> {
  const sources: { type: string; title: string; href: string }[] = [];

  for (const r of results) {
    try {
      if (r.entityType === "project") {
        const [p] = await db.select({ title: projects.title }).from(projects).where(eq(projects.id, r.entityId));
        if (p) sources.push({ type: "project", title: p.title, href: `/projects/${r.entityId}` });
      } else if (r.entityType === "task") {
        const [t] = await db.select({ title: tasks.title, projectId: tasks.projectId }).from(tasks).where(eq(tasks.id, r.entityId));
        if (t) sources.push({ type: "task", title: t.title, href: `/projects/${t.projectId}` });
      } else if (r.entityType === "idea") {
        const [i] = await db.select({ title: ideas.title }).from(ideas).where(eq(ideas.id, r.entityId));
        if (i) sources.push({ type: "idea", title: i.title, href: "/ideas" });
      } else if (r.entityType === "kb_article") {
        const [a] = await db.select({ title: kbArticles.title }).from(kbArticles).where(eq(kbArticles.id, r.entityId));
        if (a) sources.push({ type: "kb_article", title: a.title, href: `/kb/${r.entityId}` });
      }
    } catch {
      // Skip if entity not found
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return sources.filter((s) => {
    const key = `${s.type}:${s.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
