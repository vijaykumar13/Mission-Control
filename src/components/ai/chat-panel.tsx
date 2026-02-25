"use client";

import { useState, useRef, useEffect } from "react";
import { useAIChat, type ChatMessage, type ChatResponse } from "@/lib/hooks/use-ai";
import {
  MessageSquare,
  Send,
  Loader2,
  X,
  Sparkles,
  FolderKanban,
  ListTodo,
  Lightbulb,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  project: FolderKanban,
  task: ListTodo,
  idea: Lightbulb,
  kb_article: BookOpen,
};

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatResponse["sources"];
}

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const chat = useAIChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || chat.isPending) return;

    const userMsg: DisplayMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");

    try {
      const apiMessages: ChatMessage[] = updated.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await chat.mutateAsync(apiMessages);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.message, sources: result.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        },
      ]);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[var(--accent-500)] text-white shadow-lg hover:bg-[var(--accent-600)] transition-all hover:scale-105 flex items-center justify-center cursor-pointer"
        title="Chat with AI"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[380px] max-h-[560px] bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-500)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">AI Assistant</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[400px]">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-8 h-8 text-[var(--accent-500)] mx-auto mb-3 opacity-50" />
            <p className="text-sm text-[var(--text-secondary)]">
              Ask me anything about your projects, tasks, ideas, or notes.
            </p>
            <div className="mt-3 space-y-1">
              {[
                "What are my most urgent tasks?",
                "Summarize my active projects",
                "What ideas should I explore?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    inputRef.current?.focus();
                  }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-[var(--accent-500)] hover:bg-[var(--accent-50)] rounded-[var(--radius-sm)] transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-[var(--radius-lg)] text-sm ${
                msg.role === "user"
                  ? "bg-[var(--accent-500)] text-white"
                  : "bg-[var(--gray-100)] text-[var(--text-primary)]"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--border-default)]/20 space-y-1">
                  <p className="text-[10px] font-medium opacity-70">Sources:</p>
                  {msg.sources.map((s, j) => {
                    const Icon = SOURCE_ICONS[s.type] || BookOpen;
                    return (
                      <Link
                        key={j}
                        href={s.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-1.5 text-[10px] opacity-80 hover:opacity-100 transition-opacity"
                      >
                        <Icon className="w-3 h-3" />
                        <span className="truncate">{s.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {chat.isPending && (
          <div className="flex justify-start">
            <div className="bg-[var(--gray-100)] px-3 py-2 rounded-[var(--radius-lg)]">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-500)]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[var(--border-default)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your workspace..."
            className="flex-1 h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || chat.isPending}
            className="p-2 rounded-[var(--radius-md)] bg-[var(--accent-500)] text-white hover:bg-[var(--accent-600)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
