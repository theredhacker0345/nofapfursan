import { useEffect, useState } from "react";
import {
  BookOpen,
  RotateCcw,
  Flag,
  UserRound,
  Cloud,
  HeartPulse,
  Pin,
  type LucideIcon,
} from "lucide-react";

import { getActivityLog, type ActivityEntry, type ActivityType } from "@/services/localStore";
import { EmptyState } from "@/components/EmptyState";

/** Lucide glyphs instead of emoji — emoji render per-OS and cannot be themed. */
const ICONS: Record<ActivityType, LucideIcon> = {
  journal_save: BookOpen,
  streak_start: Flag,
  streak_reset: RotateCcw,
  profile_update: UserRound,
  cloud_sync: Cloud,
  health_check: HeartPulse,
  note: Pin,
};

const relativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

export function ActivityHistory() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    setEntries(getActivityLog());

    const refresh = () => setEntries(getActivityLog());
    window.addEventListener("fursan_streak_updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("fursan_streak_updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (entries.length === 0) {
    return (
      <EmptyState
        title="Nothing recorded yet"
        description="Start a streak or write your first journal entry — both show up here."
      />
    );
  }

  return (
    <ul className="surface-group">
      {entries.slice(0, 20).map((entry) => {
        const Icon = ICONS[entry.type] ?? Pin;
        return (
          <li key={entry.id} className="row">
            <Icon className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-body-s text-ink">{entry.message}</span>
              <time
                className="block font-data text-meta text-ink-faint"
                dateTime={new Date(entry.timestamp).toISOString()}
              >
                {relativeTime(entry.timestamp)}
              </time>
            </span>
          </li>
        );
      })}
    </ul>
  );
}