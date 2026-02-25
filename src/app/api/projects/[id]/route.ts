import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateProjectSchema } from "@/lib/validations";
import { apiSuccess, apiError, parseBody, ValidationError } from "@/lib/api-helpers";
import { buildEmbeddingContent, embedInBackground, deleteEmbedding } from "@/lib/ai/embeddings";

// GET /api/projects/:id - Get a single project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [project] = await db.select().from(projects).where(eq(projects.id, id));

    if (!project) {
      return apiError("Project not found", 404);
    }

    return apiSuccess(project);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("GET /api/projects/:id error:", err);
    return apiError("Failed to fetch project", 500);
  }
}

// PATCH /api/projects/:id - Update a project
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await parseBody(request, updateProjectSchema);

    const [existing] = await db.select().from(projects).where(eq(projects.id, id));
    if (!existing) {
      return apiError("Project not found", 404);
    }

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    // Handle date conversions
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.targetDate !== undefined) {
      updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
    }

    // Auto-set completedDate when status changes to completed
    if (data.status === "completed" && existing.status !== "completed") {
      updateData.completedDate = new Date();
    } else if (data.status && data.status !== "completed") {
      updateData.completedDate = null;
    }

    await db.update(projects).set(updateData).where(eq(projects.id, id));

    const [updated] = await db.select().from(projects).where(eq(projects.id, id));

    // Re-embed on update
    if (data.title || data.description !== undefined) {
      const content = buildEmbeddingContent("project", { title: updated.title, description: updated.description });
      embedInBackground(id, "project", content);
    }

    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("PATCH /api/projects/:id error:", err);
    return apiError("Failed to update project", 500);
  }
}

// DELETE /api/projects/:id - Delete a project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [existing] = await db.select().from(projects).where(eq(projects.id, id));
    if (!existing) {
      return apiError("Project not found", 404);
    }

    await db.delete(projects).where(eq(projects.id, id));
    deleteEmbedding(id, "project").catch(() => {});
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof ValidationError) return apiError(err.message);
    console.error("DELETE /api/projects/:id error:", err);
    return apiError("Failed to delete project", 500);
  }
}
