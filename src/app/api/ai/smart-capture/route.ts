import { z } from "zod";
import { db } from "@/lib/db";
import { tasks, ideas, kbArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError, parseBody, ValidationError } from "@/lib/api-helpers";
import { parseCapture } from "@/lib/ai/smart-capture";
import { buildEmbeddingContent, embedInBackground } from "@/lib/ai/embeddings";
import { createId } from "@/lib/utils/id";

const schema = z.object({
  input: z.string().min(1).max(1000),
  projectId: z.string().optional(), // default project for tasks
});

export async function POST(request: Request) {
  try {
    const data = await parseBody(request, schema);
    const parsed = parseCapture(data.input);
    const now = new Date();
    const id = createId();

    let result: { id: string; type: string; title: string; href: string };

    if (parsed.type === "task") {
      // Need a project ID for tasks
      if (!data.projectId) {
        return apiError("A project is required to create a task. Use 'idea:' prefix or select a project.", 400);
      }

      await db.insert(tasks).values({
        id,
        projectId: data.projectId,
        title: parsed.title,
        status: "todo",
        priority: parsed.priority || null,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      });

      const content = buildEmbeddingContent("task", { title: parsed.title });
      embedInBackground(id, "task", content);

      result = { id, type: "task", title: parsed.title, href: `/projects/${data.projectId}` };
    } else if (parsed.type === "kb_article") {
      const slug = parsed.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);

      await db.insert(kbArticles).values({
        id,
        title: parsed.title,
        slug: `${slug}-${id.slice(0, 4)}`,
        content: "",
        pinned: false,
        createdAt: now,
        updatedAt: now,
      });

      const content = buildEmbeddingContent("kb_article", { title: parsed.title });
      embedInBackground(id, "kb_article", content);

      result = { id, type: "kb_article", title: parsed.title, href: `/kb/${id}` };
    } else {
      // Default: idea
      await db.insert(ideas).values({
        id,
        title: parsed.title,
        stage: parsed.stage || "spark",
        createdAt: now,
        updatedAt: now,
      });

      const content = buildEmbeddingContent("idea", { title: parsed.title });
      embedInBackground(id, "idea", content);

      result = { id, type: "idea", title: parsed.title, href: "/ideas" };
    }

    // Also log activity
    const { activities } = await import("@/lib/db/schema");
    await db.insert(activities).values({
      id: createId(),
      entityId: id,
      entityType: result.type === "kb_article" ? "kb_article" : result.type as "task" | "idea",
      action: "created",
      title: `Created ${result.type}: ${parsed.title}`,
      source: "local",
      createdAt: now,
    });

    return apiSuccess({ ...result, parsed }, 201);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("POST /api/ai/smart-capture error:", err);
    return apiError("Failed to process capture", 500);
  }
}
