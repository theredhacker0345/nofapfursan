import { getStreakData, calculateStreak, getAvatarLevel } from "@/lib/streakUtils";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

interface HeaderProps {
  syncState?: "syncing" | "synced" | "offline";
}

export function Header({ syncState = "synced" }: HeaderProps) {
  const [level, setLevel] = useState<{ name: string; emoji: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getStreakData();
      if (data.startDate) {
        const { days } = calculateStreak(data.startDate);
        setLevel(getAvatarLevel(days));
      } else {
        setLevel(null);
      }
    };
    load();
    window.addEventListener("fursan_streak_updated", load);
    return () => window.removeEventListener("fursan_streak_updated", load);
  }, []);

  const statusLabel =
    syncState === "syncing"
      ? "Syncing"
      : syncState === "offline"
      ? "Offline"
      : "Synced";

  return (
    <header className="flex items-center justify-between py-4">
      <Logo size={28} />

      <div className="flex items-center gap-2 text-[12px] text-ink-muted">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            syncState === "syncing"
              ? "bg-warning animate-pulse"
              : syncState === "offline"
              ? "bg-danger"
              : "bg-success"
          }`}
          aria-hidden="true"
        />
        <span className="font-medium">{statusLabel}</span>
        {level && (
          <>
            <span className="text-ink-faint">·</span>
            <span className="font-medium">
              {level.emoji} {level.name}
            </span>
          </>
        )}
      </div>
    </header>
  );
}
