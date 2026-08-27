import { getStreakData, calculateStreak, getAvatarLevel } from "@/lib/streakUtils";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { generateOrLoadKeys } from "@/services/nostr";

interface HeaderProps {
  syncState?: "syncing" | "synced" | "offline";
}

export function Header({ syncState = "synced" }: HeaderProps) {
  const [level, setLevel] = useState<{ name: string; emoji: string } | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getStreakData();
      if (data.startDate) {
        const { days } = calculateStreak(data.startDate);
        setLevel(getAvatarLevel(days));
      } else {
        setLevel(null);
      }
      
      // Load user identity
      try {
        const identity = await generateOrLoadKeys();
        if (identity?.publicKey) {
          const storedName = localStorage.getItem(`nostr_username_${identity.publicKey}`);
          const storedAvatar = localStorage.getItem(`nostr_avatar_${identity.publicKey}`);
          setUserName(storedName || "");
          setAvatarUrl(storedAvatar || null);
        }
      } catch (e) {
        console.error("Failed to load identity", e);
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

      <div className="flex items-center gap-3 text-[12px] text-ink-muted">
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
        {userName && (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <Avatar src={avatarUrl} name={userName} size="sm" />
            <span className="text-[11px] font-medium text-ink truncate max-w-[80px]">{userName}</span>
          </div>
        )}
      </div>
    </header>
  );
}
