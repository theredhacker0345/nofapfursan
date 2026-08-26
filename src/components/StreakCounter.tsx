import { calculateStreak } from "@/lib/streakUtils";

interface StreakCounterProps {
  startDate: string | null;
}

export function StreakCounter({ startDate }: StreakCounterProps) {
  if (!startDate) {
    return (
      <div className="py-12 text-center">
        <p className="text-[64px] font-display font-extrabold leading-none tracking-tighter text-ink-faint tabular">
          0
        </p>
        <p className="mt-2 text-[13px] font-medium uppercase tracking-[0.18em] text-ink-faint">
          days
        </p>
        <p className="mx-auto mt-6 max-w-[260px] text-sm text-ink-muted">
          Begin your streak today. One day at a time.
        </p>
      </div>
    );
  }

  const { days, hours, minutes } = calculateStreak(startDate);
  const total = Math.max(days * 24 * 60 + hours * 60 + minutes, 1);
  // Simple progress vs. a 90-day checkpoint so the bar feels purposeful
  const progress = Math.min(days / 90, 1);

  return (
    <div className="text-center">
      <p className="text-[120px] font-display font-extrabold leading-[0.95] tracking-tighter text-ink tabular">
        {days}
      </p>
      <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
        days strong
      </p>

      {/* Hairline progress bar toward 90 days */}
      <div className="mx-auto mt-8 h-px w-full max-w-[260px] bg-border">
        <div
          className="h-px bg-accent transition-all duration-700"
          style={{ width: `${progress * 100}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 text-[12px] text-ink-faint tabular">
        <span>{hours}h</span>
        <span className="text-ink-faint/40">·</span>
        <span>{minutes}m</span>
        <span className="text-ink-faint/40">·</span>
        <span className="font-medium text-ink-muted">
          {total.toLocaleString()} min
        </span>
      </div>
    </div>
  );
}
