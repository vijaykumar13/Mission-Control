"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  variant?: "danger" | "warning";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  loading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-[30%] -translate-x-1/2 w-full max-w-sm z-50">
          <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    variant === "danger"
                      ? "bg-red-50 text-[var(--danger)]"
                      : "bg-amber-50 text-[var(--warning)]"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <Dialog.Title className="text-sm font-semibold text-[var(--text-primary)]">
                    {title}
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-[var(--text-secondary)] mt-1">
                    {description}
                  </Dialog.Description>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Dialog.Close asChild>
                  <Button variant="ghost" size="sm" disabled={loading}>
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={onConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
