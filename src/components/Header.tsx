import { getStreakData, calculateStreak, getAvatarLevel } from "@/lib/streakUtils";
import { useEffect, useState } from "react";
import { FursanLogo } from "@/components/FursanLogo";

export function Header() {
  const [level, setLevel] = useState<{ name: string, emoji: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getStreakData();
      if (data.startDate) {
        const { days } = calculateStreak(data.startDate);
        const lvl = getAvatarLevel(days);
        setLevel(lvl);
      } else {
        setLevel(null);
      }
    };
    loadData();

    // Re-load whenever the streak updates so the badge stays in sync
    window.addEventListener('fursan_streak_updated', loadData);
    return () => window.removeEventListener('fursan_streak_updated', loadData);
  }, []);

  return (
    <header className="flex flex-col items-center justify-center gap-3 py-8 page-transition">
      <div className="relative">
        <div className="p-3 bg-primary-container rounded-2xl">
          <FursanLogo className="w-14 h-14 text-on-primary-container" />
        </div>
        {level && (
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-secondary-container text-on-secondary-container text-[11px] font-medium px-3 py-1 rounded-full whitespace-nowrap">
            {level.emoji} {level.name}
          </div>
        )}
      </div>

      <div className="text-center mt-2 px-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Fursan
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Private streak tracking on Nostr</p>
      </div>
    </header>
  );
}
