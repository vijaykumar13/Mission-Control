import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "default", size = "sm", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-[var(--radius-sm)]",
        {
          "bg-[var(--gray-100)] text-[var(--gray-700)]": variant === "default",
          "bg-emerald-100 text-emerald-800": variant === "success",
          "bg-amber-100 text-amber-800": variant === "warning",
          "bg-red-100 text-red-800": variant === "danger",
          "bg-blue-100 text-blue-800": variant === "info",
          "bg-purple-100 text-purple-800": variant === "purple",
        },
        {
          "px-2 py-0.5 text-xs": size === "sm",
          "px-2.5 py-1 text-sm": size === "md",
        },
        className
      )}
      {...props}
    />
  );
}
