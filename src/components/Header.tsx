import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CloudOff, Cloud, Loader2, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MilestoneBadge } from "@/components/MilestoneBadge";
import { daysSinceStart, getStreakData } from "@/lib/streakUtils";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { cn } from "@/lib/utils";

interface HeaderProps {
  /** Rendered on the trailing edge (settings, avatar, …). */
  action?: ReactNode;
}

/**
 * Honest sync state. The previous header hard-coded `syncState="synced"` on every
 * route and rendered a permanent green dot, so a user with three dead relays and
 * a full offline queue was told everything was fine.
 */
function SyncStatus() {
  const { isOnline, isSyncing, pendingCount, droppedCount } = useNetworkStatus();

  const tone = !isOnline ? "text-warning" : isSyncing || pendingCount > 0 ? "text-ink-muted" : "text-success";
  const Icon = !isOnline ? CloudOff : isSyncing ? Loader2 : pendingCount > 0 ? Cloud : Check;

  const label = !isOnline
    ? pendingCount > 0
      ? `Offline — ${pendingCount} waiting`
      : "Offline — records stay on this device"
    : isSyncing
      ? "Syncing"
      : pendingCount > 0
        ? `${pendingCount} waiting to sync`
        : droppedCount > 0
          ? "Synced"
          : "Synced";

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-meta", tone)}
      role="status"
      aria-live="polite"
      title={label}
    >
      <Icon
        className={cn("h-3.5 w-3.5 shrink-0", isSyncing && "animate-spin")}
        strokeWidth={2}
        aria-hidden="true"
      />
      {/* The dot is always visible; the words only when there is room for them. */}
      <span className="hidden text-ink-muted sm:inline">{label}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function Header({ action }: HeaderProps) {
  const [days, setDays] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const read = () => {
      void getStreakData().then((data) => {
        if (!cancelled) setDays(daysSinceStart(data.startDate));
      });
    };
    read();
    window.addEventListener("fursan_streak_updated", read);
    return () => {
      cancelled = true;
      window.removeEventListener("fursan_streak_updated", read);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/92 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-content items-center gap-3 px-5 pb-3 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <Link
          to="/"
          aria-label="Fursan — today"
          className="-ml-2 flex h-11 min-w-0 items-center gap-2 rounded-md px-2 transition-colors hover:bg-surface-2"
        >
          <Logo size={22} showWordmark={false} />
          <span className="text-body-s font-semibold uppercase tracking-[0.18em] text-ink">
            Fursan
          </span>
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-3">
          <MilestoneBadge days={days} withName={false} className="hidden sm:inline-flex" />
          <SyncStatus />
          {action}
        </div>
      </div>
    </header>
  );
}