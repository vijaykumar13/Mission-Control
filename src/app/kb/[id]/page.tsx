"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Pin,
  PinOff,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { use, useState, useCallback, useEffect } from "react";
import { useKBArticle, useUpdateKBArticle, useDeleteKBArticle } from "@/lib/hooks/use-kb";
import { TipTapEditor } from "@/components/editor/tiptap-editor";
import "@/components/editor/editor-styles.css";
import { useRouter } from "next/navigation";
import { FindSimilar } from "@/components/ai/find-similar";
import { SuggestTags } from "@/components/ai/suggest-tags";
import { useSummarizeArticle } from "@/lib/hooks/use-ai";

export default function KBArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: article, isLoading } = useKBArticle(id);
  const updateArticle = useUpdateKBArticle();
  const deleteArticle = useDeleteKBArticle();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const summarize = useSummarizeArticle();
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Initialize edit state when article loads
  useEffect(() => {
    if (article) {
      setEditTitle(article.title);
      setEditContent(article.content || "");
    }
  }, [article]);

  const handleSave = useCallback(async () => {
    if (!article) return;
    try {
      await updateArticle.mutateAsync({
        id: article.id,
        title: editTitle,
        content: editContent,
      });
      setIsEditing(false);
    } catch {
      // error handled by mutation
    }
  }, [article, editTitle, editContent, updateArticle]);

  const handleTogglePin = useCallback(async () => {
    if (!article) return;
    await updateArticle.mutateAsync({
      id: article.id,
      pinned: !article.pinned,
    });
  }, [article, updateArticle]);

  const handleDelete = useCallback(async () => {
    if (!article) return;
    try {
      await deleteArticle.mutateAsync(article.id);
      router.push("/kb");
    } catch {
      // error handled
    }
  }, [article, deleteArticle, router]);

  if (isLoading) {
    return (
      <PageShell title="Loading..." description="">
        <Link
          href="/kb"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Knowledge Base
        </Link>
        <Card>
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      </PageShell>
    );
  }

  if (!article) {
    return (
      <PageShell title="Not Found" description="">
        <Link
          href="/kb"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Knowledge Base
        </Link>
        <Card>
          <p className="text-sm text-[var(--text-tertiary)] text-center py-12">
            Article not found.
          </p>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={isEditing ? "Editing Article" : article.title}
      description={
        isEditing
          ? "Make changes and save"
          : `Last updated ${new Date(article.updatedAt).toLocaleDateString()}`
      }
      actions={
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateArticle.isPending}
              >
                {updateArticle.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(article.title);
                  setEditContent(article.content || "");
                }}
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTogglePin}
              >
                {article.pinned ? (
                  <PinOff className="w-4 h-4" />
                ) : (
                  <Pin className="w-4 h-4" />
                )}
              </Button>
            </>
          )}
        </div>
      }
    >
      <Link
        href="/kb"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Knowledge Base
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Article Content */}
        <div className="lg:col-span-3">
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full h-11 px-4 text-lg font-semibold rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                placeholder="Article title"
              />
              <TipTapEditor
                content={editContent}
                onChange={setEditContent}
                placeholder="Write your article content here..."
              />
            </div>
          ) : (
            <Card>
              {article.content ? (
                <div className="tiptap">
                  <div dangerouslySetInnerHTML={{ __html: article.content }} />
                </div>
              ) : (
                <p className="text-sm text-[var(--text-tertiary)] text-center py-12">
                  No content yet.{" "}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[var(--accent-500)] hover:underline cursor-pointer"
                  >
                    Start writing
                  </button>
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Article Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Metadata
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-[var(--text-secondary)] block mb-1">
                  Status
                </span>
                <div className="flex items-center gap-1.5">
                  {article.pinned && (
                    <Badge variant="info">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </Badge>
                  )}
                  <Badge variant="default">Published</Badge>
                </div>
              </div>
              <div>
                <span className="text-xs text-[var(--text-secondary)] block mb-1">
                  Created
                </span>
                <p className="text-xs text-[var(--text-primary)]">
                  {new Date(article.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <span className="text-xs text-[var(--text-secondary)] block mb-1">
                  Last updated
                </span>
                <p className="text-xs text-[var(--text-primary)]">
                  {new Date(article.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <span className="text-xs text-[var(--text-secondary)] block mb-1">
                  Slug
                </span>
                <p className="text-xs text-[var(--text-tertiary)] font-mono">
                  {article.slug}
                </p>
              </div>
            </div>
          </Card>

          {/* AI Summary */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-500)]" />
                <span className="text-xs font-semibold text-[var(--text-primary)]">AI Summary</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    const result = await summarize.mutateAsync(id);
                    setAiSummary(result.summary);
                  } catch {}
                }}
                disabled={summarize.isPending}
              >
                {summarize.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Generate"
                )}
              </Button>
            </div>
            {aiSummary ? (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{aiSummary}</p>
            ) : summarize.isError ? (
              <p className="text-xs text-red-500">{summarize.error?.message}</p>
            ) : (
              <p className="text-xs text-[var(--text-tertiary)]">
                Click Generate to get an AI-powered summary.
              </p>
            )}
          </Card>

          {/* AI Tag Suggestions */}
          {article.title && (
            <Card>
              <SuggestTags
                content={[article.title, article.summary, article.content?.slice(0, 500)].filter(Boolean).join(" ")}
                entityId={id}
                entityType="kb_article"
              />
            </Card>
          )}

          {/* Find Similar */}
          <FindSimilar entityId={id} entityType="kb_article" />

          {/* Danger Zone */}
          <Card>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Danger Zone
            </h3>
            {showDeleteConfirm ? (
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-secondary)]">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteArticle.isPending}
                  >
                    {deleteArticle.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[var(--danger)]"
              >
                <Trash2 className="w-4 h-4" />
                Delete Article
              </Button>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
