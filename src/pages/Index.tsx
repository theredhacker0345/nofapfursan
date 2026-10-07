import { Link } from "react-router-dom";
import { Play, RotateCcw, ChevronRight, Send } from "lucide-react";
import { toast } from "sonner";

import { useStreak } from "@/hooks/useStreak";
import { Screen } from "@/components/Screen";
import { StreakCounter } from "@/components/StreakCounter";
import { DailyCheckinCard } from "@/components/DailyCheckinCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { luxuryClickVibrate } from "@/lib/vibrationUtils";
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

const SECONDARY = [
  { to: "/nutrition", label: "Nutrition", hint: "Meals and macros" },
  { to: "/archives", label: "History", hint: "Milestones and log" },
  { to: "/settings", label: "Settings", hint: "Theme, relays, privacy" },
] as const;

export default function Index() {
  const { streakData, liveStreak, ready, handleStart, handleReset } = useStreak();

  if (!ready) return <LoadingScreen message="Loading" subMessage="Reading your records" />;

  const isActive = !!streakData.startDate;

  /** The /join route existed but nothing in the app ever linked to it. */
  const shareChallenge = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/join?streak=${liveStreak.days}`;
    const text = `I am on day ${liveStreak.days} with Fursan. Beat it.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Fursan", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Challenge link copied");
      void luxuryClickVibrate();
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      toast.error("Could not share. Copy the address bar instead.");
    }
  };

  return (
    <Screen withNav>
      <h1 className="sr-only">Fursan — day {liveStreak.days} of discipline</h1>

      <section className="pt-4" aria-label="Current streak">
        <StreakCounter startDate={streakData.startDate} />
      </section>

      <section className="pt-6">
        {!isActive ? (
          <button
            type="button"
            onClick={() => void handleStart()}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-label uppercase text-bg transition-opacity hover:opacity-90"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            Start my streak
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void shareChallenge()}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border text-label uppercase text-ink transition-colors hover:bg-surface-2"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              Challenge a friend
            </button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  aria-label="Reset your streak"
                  title="Reset streak"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-danger/5 hover:text-danger"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-lg border border-border bg-surface">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-section text-ink">
                    Reset your streak?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-body-s text-ink-muted">
                    The counter returns to zero and this attempt is recorded as a
                    relapse. Your history and best streak are kept.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="h-11 rounded-md border border-border bg-surface text-label uppercase text-ink hover:bg-surface-2">
                    Keep going
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => void handleReset()}
                    className="h-11 rounded-md bg-danger text-label uppercase text-on-accent hover:opacity-90"
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </section>

      <section className="pt-6">
        <DailyCheckinCard />
      </section>

      <section className="surface-group mt-8">
        {SECONDARY.map(({ to, label, hint }) => (
          <Link key={to} to={to} className="row">
            <span className="min-w-0 flex-1">
              <span className="block text-body-s font-semibold text-ink">{label}</span>
              <span className="block text-meta text-ink-muted">{hint}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
          </Link>
        ))}
      </section>
    </Screen>
  );
}