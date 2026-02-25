import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-500)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          {
            "bg-[var(--accent-500)] text-white hover:bg-[var(--accent-600)] active:bg-[var(--accent-700)]":
              variant === "primary",
            "bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--surface-hover)]":
              variant === "secondary",
            "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]":
              variant === "ghost",
            "bg-[var(--danger)] text-white hover:bg-red-600 active:bg-red-700":
              variant === "danger",
          },
          {
            "h-8 px-3 text-sm gap-1.5": size === "sm",
            "h-10 px-4 text-sm gap-2": size === "md",
            "h-12 px-6 text-base gap-2.5": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };
