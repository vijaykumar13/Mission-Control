import { db } from "@/lib/db";
import { activities, projects, tasks, ideas, kbArticles } from "@/lib/db/schema";
import { desc, gte, eq } from "drizzle-orm";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

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

/** Generate a weekly AI digest of workspace activity */
export async function generateWeeklyDigest(): Promise<WeeklyDigest> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Gather data from the past week
  const [recentActivities, allProjects, allTasks, allIdeas, allArticles] = await Promise.all([
    db.select().from(activities).where(gte(activities.createdAt, oneWeekAgo)).orderBy(desc(activities.createdAt)),
    db.select().from(projects),
    db.select().from(tasks),
    db.select().from(ideas).where(gte(ideas.createdAt, oneWeekAgo)),
    db.select().from(kbArticles).where(gte(kbArticles.createdAt, oneWeekAgo)),
  ]);

  const activeProjects = allProjects.filter((p) => p.status === "active");
  const completedTasks = recentActivities.filter((a) => a.action === "completed" && a.entityType === "task");
  const createdTasks = recentActivities.filter((a) => a.action === "created" && a.entityType === "task");

  const stats = {
    tasksCompleted: completedTasks.length,
    tasksCreated: createdTasks.length,
    ideasCreated: allIdeas.length,
    articlesWritten: allArticles.length,
    activeProjects: activeProjects.length,
  };

  // Build context for AI
  const activitySummary = recentActivities
    .slice(0, 50)
    .map((a) => `- ${a.action}: ${a.title} (${a.source})`)
    .join("\n");

  const projectSummary = activeProjects
    .map((p) => {
      const projectTasks = allTasks.filter((t) => t.projectId === p.id);
      const done = projectTasks.filter((t) => t.status === "done").length;
      return `- ${p.title}: ${done}/${projectTasks.length} tasks done (${p.status})`;
    })
    .join("\n");

  const pendingTasks = allTasks
    .filter((t) => t.status !== "done")
    .slice(0, 10)
    .map((t) => `- ${t.title} (${t.priority || "no priority"})`)
    .join("\n");

  const prompt = `You are an AI productivity assistant. Generate a weekly digest for a personal command center.

Here's the data from the past week:

ACTIVITY LOG (most recent):
${activitySummary || "No activity recorded."}

ACTIVE PROJECTS:
${projectSummary || "No active projects."}

PENDING TASKS:
${pendingTasks || "No pending tasks."}

STATS:
- Tasks completed: ${stats.tasksCompleted}
- Tasks created: ${stats.tasksCreated}
- Ideas captured: ${stats.ideasCreated}
- Articles written: ${stats.articlesWritten}
- Active projects: ${stats.activeProjects}

Generate a JSON response with:
1. "summary" - A 2-3 sentence overview of the week
2. "highlights" - Array of 3-5 key highlights/accomplishments
3. "suggestions" - Array of 2-3 actionable suggestions for next week

Respond ONLY with valid JSON, no markdown.`;

  const res = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${error}`);
  }

  const json = await res.json();
  const content = json.choices[0]?.message?.content || "{}";

  try {
    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || "No summary available.",
      highlights: parsed.highlights || [],
      suggestions: parsed.suggestions || [],
      stats,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      summary: content.slice(0, 500),
      highlights: [],
      suggestions: [],
      stats,
      generatedAt: new Date().toISOString(),
    };
  }
}

/** Summarize a KB article using AI */
export async function summarizeArticle(articleId: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const [article] = await db
    .select()
    .from(kbArticles)
    .where(eq(kbArticles.id, articleId));

  if (!article) throw new Error("Article not found");

  // Strip HTML tags for plain text
  const plainText = article.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  if (plainText.length < 50) {
    return "Article is too short to summarize.";
  }

  const res = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: `Summarize the following article in 2-3 concise sentences:\n\nTitle: ${article.title}\n\n${plainText.slice(0, 8000)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${error}`);
  }

  const json = await res.json();
  return json.choices[0]?.message?.content || "Could not generate summary.";
}
