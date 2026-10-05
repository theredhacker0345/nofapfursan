import { Shield } from "lucide-react";
import { StreakData, calculateStreak, getNextMilestone, isNewRecord } from "@/lib/streakUtils";
import { MilestoneIcon } from "@/components/MilestoneIcon";

interface StatsCardProps {
  data: StreakData;
}

interface MetricProps {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  icon?: React.ReactNode;
  emphasis?: boolean;
}

function Metric({ label, value, unit, note, icon, emphasis }: MetricProps) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      {icon && <span className="shrink-0 text-ink-faint">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-label uppercase text-ink-faint">{label}</p>
        <p className="mt-0.5 flex items-baseline gap-1.5">
          <span className={`font-data text-data-lg ${emphasis ? "text-ink" : "text-ink"}`}>{value}</span>
          {unit && <span className="text-meta text-ink-muted">{unit}</span>}
        </p>
      </div>
      {note && <span className="shrink-0 text-meta text-ink-muted">{note}</span>}
    </div>
  );
}

/**
 * One flat surface, one metric grammar, no shadows and no gradient pills.
 * The previous version rendered a `bg-white/60` block, `text-gray-700` values
 * (invisible on dark themes) and a permanently-true "NEW RECORD" badge.
 */
export function StatsCard({ data }: StatsCardProps) {
  const { days } = calculateStreak(data.startDate);
  const best = Math.max(data.longestStreak || 0, days);
  const next = getNextMilestone(days);
  const record = isNewRecord(days, data.longestStreak);

  return (
    <div className="surface-group">
      <Metric
        label="Current streak"
        value={String(days)}
        unit={days === 1 ? "day" : "days"}
        icon={<Shield className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
        emphasis
        note={record ? "Personal best" : undefined}
      />
      <Metric label="Personal best" value={String(best)} unit={best === 1 ? "day" : "days"} />
      <Metric label="Relapses" value={String(data.totalRelapses || 0)} />
      <Metric
        label="Next milestone"
        value={next ? String(next.minDays - days) : "—"}
        unit={next ? "days" : undefined}
        note={next ? next.name : "All reached"}
        icon={next ? <MilestoneIcon milestone={next} /> : undefined}
      />
    </div>
  );
}