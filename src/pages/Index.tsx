import { Header } from "@/components/Header";
import { StreakCounter } from "@/components/StreakCounter";
import { BottomNav } from "@/components/BottomNav";
import { SyncIndicator } from "@/components/SyncIndicator";
import { DailyHealthCheck } from "@/components/DailyHealthCheck";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useStreak } from "@/hooks/useStreak";
import { StreakActions } from "@/components/StreakActions";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

const Index = () => {
  const {
    streakData,
    liveStreak,
    isSyncing,
    isOnline,
    pendingCount,
    handleStart,
    handleReset
  } = useStreak();

  if (!streakData || !liveStreak) {
    return <LoadingScreen message="Starting up..." subMessage="Setting things up for you" />;
  }

  const isActive = streakData?.startDate !== null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-lg mx-auto px-4">
        <Header />

        {/* Sync status */}
        <div className="flex justify-between items-center mb-6">
          <SyncIndicator
            isSyncing={isSyncing}
            isOnline={isOnline}
            pendingCount={pendingCount}
          />
        </div>

        {/* Progress summary */}
        <section className="mb-6 rounded-2xl border border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {isActive ? "Streak active" : "Ready to start"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {isActive
                  ? "Keep going — do your daily check-ins and protect your streak."
                  : "Start your streak to unlock full tracking and get your first win."}
              </p>
            </div>
            <div className="rounded-2xl bg-primary-container px-3.5 py-2 text-center min-w-[72px]">
              <p className="text-[11px] font-medium text-on-primary-container/70">Day</p>
              <p className="text-2xl font-bold text-on-primary-container leading-tight">{liveStreak.days}</p>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-5 w-full">
          <StreakCounter
            startDate={streakData?.startDate}
            isSyncing={isSyncing}
            isOnline={isOnline}
            pendingCount={pendingCount}
          />

          {/* Daily check-in: Mind */}
          <DailyHealthCheck showPillar="mindset" days={liveStreak.days} />

          {/* Daily check-in: Body */}
          <DailyHealthCheck showPillar="biological" days={liveStreak.days} />

          {/* Start / Reset controls */}
          <div className="py-2">
            <StreakActions
              isActive={isActive}
              onStart={handleStart}
              onReset={handleReset}
            />
          </div>
        </div>

        <footer className="mt-10 pb-4 flex items-center justify-center gap-6 text-muted-foreground">
          <p className="text-xs">Stay strong and keep going. ⚔️</p>
          <Link
            to="/settings"
            aria-label="Open settings"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2"
          >
            <Settings className="w-3.5 h-3.5" aria-hidden="true" />
            Settings
          </Link>
        </footer>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
