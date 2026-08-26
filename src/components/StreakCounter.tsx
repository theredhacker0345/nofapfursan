import { useRef } from "react";
import { Clock, Calendar } from "lucide-react";
import { calculateStreak } from "@/lib/streakUtils";
import { motion } from "framer-motion";
import { DynamicFire } from "@/components/DynamicComponents";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface StreakCounterProps {
  startDate: string | null;
  isSyncing?: boolean;
  isOnline?: boolean;
  pendingCount?: number;
}

export function StreakCounter({ startDate, isSyncing, isOnline, pendingCount }: StreakCounterProps) {
  const streak = calculateStreak(startDate);
  const prevDaysRef = useRef(streak.days);

  // Trigger haptics if day count increases
  if (streak.days > prevDaysRef.current && startDate) {
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => { });
    prevDaysRef.current = streak.days;
  }

  const isNewUser = !startDate;

  return (
    <div className="royal-card relative p-6 page-transition">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <DynamicFire streakDays={streak.days} className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Current streak</span>
        </div>

        {startDate && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-[11px] font-medium">
            {isSyncing ? (
              <>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                Syncing
              </>
            ) : isOnline ? (
              <>
                <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                Synced
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                Offline
              </>
            )}
          </div>
        )}
      </div>

      {isNewUser ? (
        <div className="text-center py-10 rounded-xl bg-secondary/50">
          <p className="text-2xl font-bold tracking-tight mb-2 text-foreground">Begin your journey</p>
          <p className="text-muted-foreground text-sm">
            Start your streak today and see how far you can go
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-baseline justify-center gap-1 sm:gap-3 mb-8">
            <motion.span
              key={streak.days}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-7xl sm:text-8xl font-bold tracking-tighter leading-none text-primary"
            >
              {streak.days}
            </motion.span>
            <span className="text-xl font-medium text-muted-foreground">days</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/60">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-none text-foreground truncate">{streak.hours}</p>
                <p className="text-[11px] text-muted-foreground truncate">hours</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/60">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-none text-foreground truncate">{streak.minutes}</p>
                <p className="text-[11px] text-muted-foreground truncate">minutes</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
