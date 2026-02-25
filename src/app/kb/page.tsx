"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Search, Tag, Pin, Loader2 } from "lucide-react";
import { useState } from "react";
import { useKBArticles, useCreateKBArticle } from "@/lib/hooks/use-kb";
import Link from "next/link";

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: articles, isLoading } = useKBArticles(searchQuery || undefined);
  const createArticle = useCreateKBArticle();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await createArticle.mutateAsync({ title: newTitle.trim(), content: "", pinned: false });
      setNewTitle("");
      setShowCreate(false);
    } catch {
      // handled
    }
  };

  return (
    <PageShell
      title="Knowledge Base"
      description="Your personal wiki and reference library"
      actions={
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          New Article
        </Button>
      }
    >
      {/* Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search articles... (supports natural language)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-[var(--radius-md)] bg-[var(--gray-100)] border border-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:bg-[var(--surface-card)] focus:border-[var(--border-default)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
          />
        </div>
      </div>

      {/* Create article inline */}
      {showCreate && (
        <Card>
          <form onSubmit={handleCreateArticle} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                Article Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., How to set up CI/CD pipeline"
                autoFocus
                className="w-full h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
              />
            </div>
            <Button type="submit" size="sm" disabled={!newTitle.trim() || createArticle.isPending}>
              {createArticle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowCreate(false); setNewTitle(""); }}>
              Cancel
            </Button>
          </form>
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </Card>
          ))}
        </div>
      ) : articles && articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <Link key={article.id} href={`/kb/${article.id}`}>
              <Card interactive className="h-full">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2">
                    {article.title}
                  </h3>
                  {article.pinned && (
                    <Pin className="w-3.5 h-3.5 text-[var(--accent-500)] flex-shrink-0" />
                  )}
                </div>
                {article.summary && (
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-3 mb-3">
                    {article.summary}
                  </p>
                )}
                <p className="text-xs text-[var(--text-tertiary)]">
                  Updated {new Date(article.updatedAt).toLocaleDateString()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No articles yet"
            description="Build your knowledge base by creating articles. Use markdown, add tags, and link to projects."
            action={{
              label: "Write Article",
              onClick: () => setShowCreate(true),
            }}
          />
        </Card>
      )}
    </PageShell>
  );
}
