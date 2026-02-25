import { cn } from "@/lib/utils/cn";

interface PageShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ title, description, actions, children, className }: PageShellProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{title}</h1>
          {description && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
