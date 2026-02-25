"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useToastStore, type Toast } from "@/lib/stores/toast-store";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: {
    bg: "var(--success-50, #f0fdf4)",
    border: "var(--success-200, #bbf7d0)",
    icon: "var(--success, #22c55e)",
    text: "var(--success-700, #15803d)",
  },
  error: {
    bg: "var(--danger-50, #fef2f2)",
    border: "var(--danger-200, #fecaca)",
    icon: "var(--danger, #ef4444)",
    text: "var(--danger-700, #b91c1c)",
  },
  info: {
    bg: "var(--accent-50, #eff6ff)",
    border: "var(--accent-200, #bfdbfe)",
    icon: "var(--accent-500, #5B7FD6)",
    text: "var(--accent-700, #1d4ed8)",
  },
  warning: {
    bg: "var(--warning-50, #fffbeb)",
    border: "var(--warning-200, #fde68a)",
    icon: "var(--warning, #f59e0b)",
    text: "var(--warning-700, #b45309)",
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore();
  const [isExiting, setIsExiting] = useState(false);
  const Icon = ICONS[toast.type];
  const colors = COLORS[toast.type];

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(toast.id), 200);
  };

  // Start exit animation before auto-remove
  useEffect(() => {
    const exitDelay = (toast.duration || 4000) - 300;
    if (exitDelay > 0) {
      const timer = setTimeout(() => setIsExiting(true), exitDelay);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 px-4 py-3 rounded-[var(--radius-lg)] border shadow-[var(--shadow-md)] max-w-sm w-full transition-all duration-200 ${
        isExiting
          ? "opacity-0 translate-x-4 scale-95"
          : "opacity-100 translate-x-0 scale-100"
      }`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <Icon
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        style={{ color: colors.icon }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium"
          style={{ color: colors.text }}
        >
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-xs mt-0.5 text-[var(--text-secondary)]">
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="p-0.5 rounded hover:bg-black/5 cursor-pointer flex-shrink-0"
      >
        <X className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
