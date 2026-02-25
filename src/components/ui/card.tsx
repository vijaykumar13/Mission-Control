import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "ghost";
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", interactive = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-lg)]",
          {
            "bg-[var(--surface-card)] border border-[var(--border-default)] shadow-[var(--shadow-sm)]":
              variant === "default",
            "bg-transparent border border-[var(--border-default)]": variant === "outlined",
            "bg-transparent": variant === "ghost",
          },
          {
            "p-0": padding === "none",
            "p-3": padding === "sm",
            "p-5": padding === "md",
            "p-6": padding === "lg",
          },
          interactive && "cursor-pointer hover:shadow-[var(--shadow-md)] hover:border-[var(--gray-300)]",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
export { Card };
