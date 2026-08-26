import { useStreak } from "@/hooks/useStreak";
import { Header } from "@/components/Header";
import { StreakCounter } from "@/components/StreakCounter";
import { BottomNav } from "@/components/BottomNav";
import { DailyCheckinCard } from "@/components/DailyCheckinCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { Settings, User } from "lucide-react";

const Index = () => {
  const {
    streakData,
    liveStreak,
    handleStart,
    handleReset,
  } = useStreak();

  if (!streakData || !liveStreak) {
    return <LoadingScreen message="Loading" subMessage="Setting things up" />;
  }

  const isActive = streakData?.startDate !== null;

  return (
    <div className="min-h-screen bg-bg pb-20">
      <main className="mx-auto max-w-screen-sm px-4 pt-2">
        <Header syncState="synced" />

        {/* Hero: the streak number IS the page */}
        <section className="py-8">
          <StreakCounter startDate={streakData?.startDate} />
        </section>

        {/* Start / Reset */}
        <section className="pb-2">
          {!isActive ? (
            <Button
              onClick={handleStart}
              className="h-12 w-full rounded-full bg-ink text-bg hover:bg-ink/90 font-semibold"
            >
              <Play className="h-4 w-4" />
              Start my streak
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 w-full rounded-full text-ink-faint hover:text-danger hover:bg-danger/5 text-[13px] font-medium"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset streak
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border border-border bg-bg">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-ink">Reset your streak?</AlertDialogTitle>
                  <AlertDialogDescription className="text-ink-muted">
                    Your streak returns to zero. Your past progress stays in your history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="h-11 rounded-full border border-border bg-surface text-ink">
                    Keep going
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReset}
                    className="h-11 rounded-full bg-danger text-white hover:bg-danger/90"
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </section>

        {/* Daily check-in: mind + body in one card */}
        <section className="pt-2">
          <DailyCheckinCard days={liveStreak.days} />
        </section>

        {/* Quiet footer */}
        <footer className="pt-10 pb-4 flex items-center justify-center gap-5 text-[12px] text-ink-faint">
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 hover:text-ink min-h-[44px] px-1"
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
          <span className="text-ink-faint/30">·</span>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 hover:text-ink min-h-[44px] px-1"
          >
            <User className="h-3.5 w-3.5" />
            Profile
          </Link>
        </footer>
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
