import { getMilestone } from "@/lib/streakUtils";
import { MilestoneIcon } from "@/components/MilestoneIcon";
import { cn } from "@/lib/utils";

/**
 * Progression is expressed with a lucide glyph and a name — never an emoji.
 * Emoji rendered per-OS, could not be themed, and were the single loudest
 * "template" signal in the old header.
 */
export function MilestoneBadge({
  days,
  className,
  withName = true,
}: {
  days: number;
  className?: string;
  withName?: boolean;
}) {
  if (days <= 0) return null;
  const milestone = getMilestone(days);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-meta text-ink-muted",
        className,
      )}
      title={milestone.description}
    >
      <span className="text-accent">
        <MilestoneIcon milestone={milestone} />
      </span>
      {withName && <span className="font-medium">{milestone.name}</span>}
    </span>
  );
}