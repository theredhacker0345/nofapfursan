import { useMemo } from "react";
import { getLocalHealthChecks, localDayIndex } from "@/services/localStore";
import { calculateConsecutiveCheckins } from "@/lib/streakUtils";
import { cn } from "@/lib/utils";

const WEEKS = 14;
const DAYS_PER_WEEK = 7;

/**
 * 14-week check-in grid.
 *
 * The old version animated all 98 cells in with `delay: i * 0.005` on a class
 * (`grid-rows-7`) that does not exist in the Tailwind theme, and used
 * `Math.floor((today - date) / 864e5)` against local midnights — which drifts
 * by an hour twice a year and mislabels the grid. Day maths now runs through the
 * shared local-day index.
 */
export function ActivityHeatmap() {
  const { grid, summary } = useMemo(() => {
    const days = new Set(
      getLocalHealthChecks().map((entry) => localDayIndex(new Date(entry.timestamp))),
    );
    const history = getLocalHealthChecks();

    const today = new Date();
    const cells: { key: string; filled: boolean; future: boolean; label: string }[] = [];

    const start = new Date(today);
    start.setDate(start.getDate() - (WEEKS * DAYS_PER_WEEK - 1));

    for (let i = 0; i < WEEKS * DAYS_PER_WEEK; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = localDayIndex(date);
      const future = key > localDayIndex(today);
      cells.push({
        key: `${key}`,
        filled: days.has(key),
        future,
        label: date.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      });
    }

    return {
      grid: Array.from({ length: WEEKS }, (_, w) => cells.slice(w * DAYS_PER_WEEK, (w + 1) * DAYS_PER_WEEK)),
      summary: {
        streak: calculateConsecutiveCheckins(history),
        total: days.size,
      },
    };
  }, []);

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-label uppercase text-ink-faint">Check-in consistency</p>
        <p className="font-data text-meta text-ink-muted">
          {summary.streak} day streak · {summary.total} total
        </p>
      </div>

      <div className="mt-4 flex gap-1" role="img" aria-label={`${summary.total} check-ins over the last ${WEEKS} weeks. Current run: ${summary.streak} days.`}>
        {grid.map((week, w) => (
          <div key={w} className="flex flex-1 flex-col gap-1">
            {week.map((cell) => (
              <span
                key={cell.key}
                title={`${cell.label}${cell.filled ? " — checked in" : ""}`}
                className={cn(
                  "aspect-square w-full rounded-[3px]",
                  cell.filled ? "bg-accent" : cell.future ? "bg-transparent" : "bg-surface-3",
                )}
              />
            ))}
          </div>
        ))}
      </div>

      <p className="mt-4 text-meta text-ink-faint">
        One square per day. Filled means you checked in.
      </p>
    </div>
  );
}