import { create } from "zustand";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
  duration?: number; // ms, default 4000
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, toast.duration || 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// Convenience functions
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: "success", title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: "error", title, description, duration: 6000 }),
  info: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: "info", title, description }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: "warning", title, description }),
};
