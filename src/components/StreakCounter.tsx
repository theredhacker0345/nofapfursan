import { useRef } from "react";
import { Clock, Calendar, Sparkles } from "lucide-react";
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
    <div className="royal-card relative overflow-hidden p-6 page-transition">
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary/40 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary/40 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-primary/40 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-primary/40 rounded-br-lg" />

      <div className="flex items-center justify-between mb-4 relative z-10 px-1">
        <div className="flex items-center gap-2">
          <DynamicFire streakDays={streak.days} className="w-5 h-5 text-primary" />
          <span className="text-foreground font-black uppercase tracking-widest text-[10px]">Current Streak</span>
        </div>

        {startDate && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-secondary to-background border border-primary/50 text-foreground text-[9px] font-bold uppercase tracking-widest">
            {isSyncing ? (
              <>
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                SYNCING
              </>
            ) : isOnline ? (
              <>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                SYNCED
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                OFFLINE
              </>
            )}
          </div>
        )}
      </div>

      {isNewUser ? (
        <div className="text-center py-10 relative z-10 border-2 border-dashed border-primary/40 rounded-lg bg-gradient-to-b from-secondary/50 to-transparent">
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary pulse-dormant" />
          <p className="text-2xl font-black uppercase tracking-tighter mb-2 text-gradient-gold">Begin Your Journey</p>
          <p className="text-muted-foreground text-[11px] uppercase font-bold tracking-widest">
            Start your streak today and see how far you can go
          </p>
        </div>
      ) : (
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-baseline justify-center gap-1 sm:gap-3 mb-8">
            <motion.span
              key={streak.days}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-7xl sm:text-8xl font-black tracking-tighter leading-none text-gradient-gold"
            >
              {streak.days}
            </motion.span>
            <span className="text-xl sm:text-2xl font-black uppercase tracking-widest text-muted-foreground/40">Days</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-secondary to-background border border-border group hover:border-primary/50 hover:shadow-md transition-all">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-black leading-none text-foreground truncate">{streak.hours}</p>
                <p className="text-[8px] sm:text-[9px] uppercase font-bold tracking-widest text-muted-foreground truncate">Hours</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-secondary to-background border border-border group hover:border-primary/50 hover:shadow-md transition-all">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-black leading-none text-foreground truncate">{streak.minutes}</p>
                <p className="text-[8px] sm:text-[9px] uppercase font-bold tracking-widest text-muted-foreground truncate">Minutes</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-tight">
              Journey ID: {new Date(startDate).getTime().toString(16).toUpperCase()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
