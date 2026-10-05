import { useCallback, useEffect, useMemo, useState } from "react";
import { Sun, Cloud, CloudLightning } from "lucide-react";

import { Screen, SectionHead } from "@/components/Screen";
import { DailyCheckinCard } from "@/components/DailyCheckinCard";
import { EmptyState } from "@/components/EmptyState";
import { fetchHealthChecks, type HealthCheck } from "@/services/nostr";
import { localDayIndex } from "@/services/localStore";
import { useStreak } from "@/hooks/useStreak";
import { cn } from "@/lib/utils";

const WINDOW_DAYS = 21;

type Mood = "sharp" | "foggy" | "stormy";

const MOOD_META: Record<Mood, { label: string; Icon: typeof Sun; bar: string }> = {
  sharp: { label: "Sharp", Icon: Sun, bar: "bg-success" },
  foggy: { label: "Foggy", Icon: Cloud, bar: "bg-warning" },
  stormy: { label: "Stormy", Icon: CloudLightning, bar: "bg-danger" },
};

/**
 * The trend chart is hand-rolled CSS instead of Recharts.
 *
 * Recharts cost a 378 kB chunk (105 kB gzipped) — the single largest asset in the
 * app — to draw fifteen bars. It also brought five hard-coded hex colours that
 * broke on every dark theme, a legend whose dots matched no bar, and 9px axis
 * labels. Fourteen bars of pure CSS cost zero bytes of JavaScript.
 */
export default function Vitals() {
  const { streakData } = useStreak();
  const [history, setHistory] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const checks = await fetchHealthChecks();
      setHistory(checks);
    } catch (error) {
      console.error("[Vitals] Load failed", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const days = useMemo(() => {
    const byDay = new Map<number, HealthCheck>();
    for (const entry of history) {
      const key = localDayIndex(new Date(entry.timestamp));
      const existing = byDay.get(key);
      if (!existing || entry.timestamp > existing.timestamp) byDay.set(key, entry);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: WINDOW_DAYS }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (WINDOW_DAYS - 1 - i));
      const key = localDayIndex(date);
      const entry = byDay.get(key);
      return {
        key,
        date,
        entry,
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        day: date.getDate(),
        isToday: i === WINDOW_DAYS - 1,
      };
    });
  }, [history]);

  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const sharp = history.filter((h) => h.mindset === "sharp").length;
    const signal = history.filter((h) => h.npt).length;
    return {
      sharpPct: Math.round((sharp / history.length) * 100),
      signalPct: Math.round((signal / history.length) * 100),
      total: history.length,
      latest: history[0]?.mindset as Mood | undefined,
    };
  }, [history]);

  return (
    <Screen title="Vitals" subtitle="Mind and body, last three weeks">
      <DailyCheckinCard onUpdate={() => void load()} days={streakData.longestStreak} />

      <SectionHead>Daily check-ins</SectionHead>

      {loading ? (
        <div className="h-40 animate-pulse rounded-lg border border-border bg-surface-2" aria-hidden="true" />
      ) : history.length === 0 ? (
        <EmptyState
          icon={<Sun className="h-8 w-8" aria-hidden="true" />}
          title="No check-ins yet"
          description="Once you record a few days, your pattern shows up here."
        />
      ) : (
        <>
          <figure className="card p-5">
            <figcaption className="sr-only">
              Daily mindset for the last {WINDOW_DAYS} days. {stats?.sharpPct ?? 0}% sharp,
              {" "}
              {stats?.signalPct ?? 0}% with a morning signal.
            </figcaption>

            <div className="flex items-end gap-[3px]" role="presentation">
              {days.map((day) => {
                const mood = day.entry?.mindset;
                const meta = mood ? MOOD_META[mood] : null;
                return (
                  <div
                    key={day.key}
                    title={`${day.date.toLocaleDateString()} — ${meta ? meta.label : "No check-in"}`}
                    className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        "w-full rounded-[3px]",
                        meta ? cn(meta.bar, "h-8") : "h-2 bg-surface-3",
                        day.isToday && "ring-1 ring-accent",
                      )}
                    />
                    <span
                      className={cn(
                        "font-data text-[10px] leading-none",
                        day.isToday ? "text-ink" : "text-ink-faint",
                      )}
                    >
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>

            <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {(Object.keys(MOOD_META) as Mood[]).map((mood) => {
                const { label, bar } = MOOD_META[mood];
                return (
                  <li key={mood} className="inline-flex items-center gap-1.5 text-meta text-ink-muted">
                    <span className={cn("h-2 w-2 rounded-full", bar)} aria-hidden="true" />
                    {label}
                  </li>
                );
              })}
              <li className="inline-flex items-center gap-1.5 text-meta text-ink-muted">
                <span className="h-2 w-2 rounded-full bg-surface-3" aria-hidden="true" />
                No check-in
              </li>
            </ul>
          </figure>

          <SectionHead>Summary</SectionHead>
          <div className="surface-group grid grid-cols-2 divide-x divide-border">
            <div className="px-5 py-4">
              <p className="text-label uppercase text-ink-faint">Sharp days</p>
              <p className="mt-1 font-data text-data-lg text-ink">
                {stats?.sharpPct ?? 0}
                <span className="text-ink-muted">%</span>
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-label uppercase text-ink-faint">Morning signal</p>
              <p className="mt-1 font-data text-data-lg text-ink">
                {stats?.signalPct ?? 0}
                <span className="text-ink-muted">%</span>
              </p>
            </div>
          </div>

          {stats?.latest && (
            <p className="mt-4 text-body-s text-ink-muted">
              Most recent check-in:{" "}
              <span className="font-medium text-ink">{MOOD_META[stats.latest].label}</span> over{" "}
              {stats.total} recorded.
            </p>
          )}
        </>
      )}
    </Screen>
  );
}