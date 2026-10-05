import { calculateStreak, formatElapsed, getNextMilestone } from "@/lib/streakUtils";
import { MilestoneIcon } from "@/components/MilestoneIcon";

interface StreakCounterProps {
  startDate: string | null;
}

/** The streak number is the page. Everything else is quiet. */
export function StreakCounter({ startDate }: StreakCounterProps) {
  if (!startDate) {
    return (
      <div className="py-6 text-center">
        <p className="font-display text-display-xl font-bold tabular text-ink-faint">0</p>
        <p className="mt-1 text-label uppercase text-ink-faint">days</p>
        <p className="mx-auto mt-5 max-w-[34ch] text-body-s text-ink-muted">
          Begin today. The count only starts once you do.
        </p>
      </div>
    );
  }

  const { days, elapsedMs } = calculateStreak(startDate);
  const next = getNextMilestone(days);
  const span = next ? next.minDays : Math.max(days, 1);
  const from = next ? Math.max(0, span - days) : 0;
  const progress = next ? Math.min(1, (days - from) / Math.max(1, span - from)) : 1;

  return (
    <div className="text-center">
      <p className="font-display text-display-xl font-bold tabular text-ink">{days}</p>
      <p className="mt-1 text-label uppercase text-ink-muted">days strong</p>

      {next && (
        <>
          <div
            className="mx-auto mt-8 h-px w-full max-w-[260px] bg-border"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={span}
            aria-valuenow={days}
            aria-label={`Progress toward ${next.name}`}
          >
            <div
              className="h-px bg-accent transition-[width] duration-slow ease-standard"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-meta text-ink-faint">
            <span className="text-ink-muted">{next.minDays - days}</span> days to
            <span className="inline-flex items-center gap-1 text-ink-muted">
              <MilestoneIcon milestone={next} /> {next.name}
            </span>
          </p>
        </>
      )}

      <p className="mt-4 font-data text-meta text-ink-faint">{formatElapsed(elapsedMs)} elapsed</p>
    </div>
  );
}