import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * One empty state for the whole app. Six bespoke variants existed before, each
 * with different wording and none of them telling the user what to do next.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      {icon && <div className="text-ink-faint">{icon}</div>}
      <div className="space-y-1">
        <p className="text-section font-semibold text-ink">{title}</p>
        {description && <p className="mx-auto max-w-prose text-body-s text-ink-muted">{description}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}