import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import { eq, desc, sql, and, like } from "drizzle-orm";
import { createProjectSchema } from "@/lib/validations";
import { apiSuccess, apiError, parseBody, getSearchParams, ValidationError } from "@/lib/api-helpers";
import { createId } from "@/lib/utils/id";
import { buildEmbeddingContent, embedInBackground } from "@/lib/ai/embeddings";

// GET /api/projects - List all projects
export async function GET(request: Request) {
  try {
    const params = getSearchParams(request);
    const status = params.get("status");
    const search = params.get("q");

    const conditions = [];
    if (status && status !== "all") {
      conditions.push(eq(projects.status, status as "active" | "paused" | "completed" | "archived"));
    }
    if (search) {
      conditions.push(like(projects.title, `%${search}%`));
    }

    const result = await db
      .select()
      .from(projects)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(projects.updatedAt));

    // Get task counts per project
    const taskCounts = await db
      .select({
        projectId: tasks.projectId,
        total: sql<number>`count(*)`.as("total"),
        done: sql<number>`sum(case when ${tasks.status} = 'done' then 1 else 0 end)`.as("done"),
      })
      .from(tasks)
      .groupBy(tasks.projectId);

    const taskCountMap = new Map(
      taskCounts.map((tc) => [tc.projectId, { total: tc.total, done: tc.done }])
    );

    const enriched = result.map((p) => ({
      ...p,
      taskStats: taskCountMap.get(p.id) || { total: 0, done: 0 },
    }));

    return apiSuccess(enriched);
  } catch (err) {
    console.error("GET /api/projects error:", err);
    return apiError("Failed to fetch projects", 500);
  }
}

// POST /api/projects - Create a project
export async function POST(request: Request) {
  try {
    const data = await parseBody(request, createProjectSchema);

    const now = new Date();
    const id = createId();

    const newProject = {
      id,
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : null,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      completedDate: null,
      externalId: null,
      externalSource: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(projects).values(newProject);

    const [created] = await db.select().from(projects).where(eq(projects.id, id));

    // Auto-embed for semantic search
    const content = buildEmbeddingContent("project", { title: data.title, description: data.description });
    embedInBackground(id, "project", content);

    return apiSuccess(created, 201);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("POST /api/projects error:", err);
    return apiError("Failed to create project", 500);
  }
}
