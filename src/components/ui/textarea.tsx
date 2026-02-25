import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full min-h-[80px] px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-y",
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
export { Textarea };
