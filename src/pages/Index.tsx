import { Header } from "@/components/Header";
import { StreakCounter } from "@/components/StreakCounter";
import { BottomNav } from "@/components/BottomNav";
import { SyncIndicator } from "@/components/SyncIndicator";
import { DailyHealthCheck } from "@/components/DailyHealthCheck";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useStreak } from "@/hooks/useStreak";
import { SettingsDialog } from "@/components/SettingsDialog";
import { StreakActions } from "@/components/StreakActions";

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
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute bottom-8 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container relative z-10 max-w-lg mx-auto px-4">
        <Header />

        {/* Top Header with Gear Icon */}
        <div className="flex justify-between items-center mb-6 mt-2">
          <div className="flex-1">
            <SyncIndicator
              isSyncing={isSyncing}
              isOnline={isOnline}
              pendingCount={pendingCount}
            />
          </div>
          <SettingsDialog />
        </div>

        <section className="mb-6 rounded-3xl border border-primary/30 bg-card/80 backdrop-blur-md px-5 py-4 shadow-[0_12px_32px_hsl(var(--foreground)/0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground">My Progress</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">
                {isActive ? "Streak Active" : "Ready to Start"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isActive
                  ? "Keep going — do your daily check-ins and protect your streak."
                  : "Start your streak to unlock full tracking and get your first win."}
              </p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/15 px-3 py-2 text-center min-w-[90px]">
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-muted-foreground">Day</p>
              <p className="mt-1 text-2xl font-black text-primary">{liveStreak.days}</p>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6 w-full">
          <div className="stagger-item" style={{ animationDelay: '0.05s' }}>
            <StreakCounter
              startDate={streakData?.startDate}
              isSyncing={isSyncing}
              isOnline={isOnline}
              pendingCount={pendingCount}
            />
          </div>

          {/* Daily check-in: Mind */}
          <div className="stagger-item" style={{ animationDelay: '0.15s' }}>
            <DailyHealthCheck showPillar="mindset" days={liveStreak.days} />
          </div>

          {/* Daily check-in: Body */}
          <div className="stagger-item" style={{ animationDelay: '0.2s' }}>
            <DailyHealthCheck showPillar="biological" days={liveStreak.days} />
          </div>

          {/* Start / Reset controls */}
          <div className="stagger-item py-4" style={{ animationDelay: '0.3s' }}>
            <StreakActions
              isActive={isActive}
              onStart={handleStart}
              onReset={handleReset}
            />
          </div>
        </div>

        <footer className="mt-12 text-center text-muted-foreground">
          <p className="font-black uppercase tracking-[0.4em] text-[9px] opacity-60 sub-label">Stay strong and keep going. ⚔️</p>
        </footer>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
