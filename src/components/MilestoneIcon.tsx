import { Shield, Flame, Mountain, Anchor, Gem, Crown } from "lucide-react";
import type { Milestone } from "@/lib/streakUtils";

const ICONS = {
  Shield,
  Flame,
  Mountain,
  Anchor,
  Gem,
  Crown,
} as const;

/** The glyph for a progression milestone. Separate file so it can be shared. */
export function MilestoneIcon({
  milestone,
  className,
}: {
  milestone: Milestone;
  className?: string;
}) {
  const Icon = ICONS[milestone.icon] ?? Shield;
  return <Icon className={className ?? "h-3.5 w-3.5"} strokeWidth={2} aria-hidden="true" />;
}