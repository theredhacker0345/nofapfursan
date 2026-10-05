import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, RotateCcw, Sun, Cloud, CloudLightning, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { saveHealthCheck, fetchHealthChecks, type HealthCheck } from "@/services/nostr";
import { logActivity } from "@/services/localStore";
import { luxuryClickVibrate } from "@/lib/vibrationUtils";
import { cn } from "@/lib/utils";
import { LoadingBlock } from "@/components/LoadingScreen";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Mindset = "sharp" | "foggy" | "stormy";

const MINDSETS: { value: Mindset; label: string; Icon: typeof Sun; active: string }[] = [
  { value: "sharp", label: "Sharp", Icon: Sun, active: "bg-ink text-bg border-ink" },
  { value: "foggy", label: "Foggy", Icon: Cloud, active: "bg-surface-3 text-ink border-ink" },
  { value: "stormy", label: "Stormy", Icon: CloudLightning, active: "bg-danger text-on-accent border-danger" },
];

const STORMY_KEY = "fursan_stormy_resolved";
const UNLOCK_SECONDS = 5;

interface DailyCheckinCardProps {
  onUpdate?: () => void;
  days?: number;
}

/**
 * One card, two rows: mind and body in a single surface.
 *
 * Behavioural fixes: the card no longer renders `null` while the relay query is
 * in flight (it used to disappear for up to ten seconds, or forever with an
 * empty relay list), list updates use a functional `setState` so an in-flight
 * fetch cannot overwrite a just-saved entry, and the emergency overlay is built
 * from theme tokens instead of a hard-coded black panel.
 */
export function DailyCheckinCard({ onUpdate }: DailyCheckinCardProps) {
  const [history, setHistory] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMedicalAlert, setShowMedicalAlert] = useState(false);
  const [isEmergencyLocked, setIsEmergencyLocked] = useState(false);
  const [isCompletionConfirmed, setIsCompletionConfirmed] = useState(false);
  const [unlockTimer, setUnlockTimer] = useState(UNLOCK_SECONDS);
  const [todayEntry, setTodayEntry] = useState<HealthCheck | null>(null);

  const [workingMindset, setWorkingMindset] = useState<Mindset | null>(null);
  const [workingNpt, setWorkingNpt] = useState<boolean | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchHealthChecks();
        if (cancelled || !mounted.current) return;
        setHistory(data);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayRec = data.find((e) => e.timestamp >= todayStart.getTime()) ?? null;

        setTodayEntry(todayRec);
        setWorkingMindset(todayRec?.mindset ?? null);
        setWorkingNpt(todayRec?.npt ?? null);

        // Stormy yesterday and not yet acknowledged → offer the interrupt.
        let resolved = false;
        try {
          resolved = localStorage.getItem(STORMY_KEY) === "true";
        } catch {
          resolved = false;
        }
        if (!resolved && todayRec?.mindset === "stormy") {
          setIsEmergencyLocked(true);
          setUnlockTimer(UNLOCK_SECONDS);
        }

        if (data.length >= 14) {
          const recent = data.slice(0, 14);
          if (recent.every((e) => !e.npt)) setShowMedicalAlert(true);
        }
      } catch (error) {
        console.error("[Checkin] Failed to load history", error);
      } finally {
        if (!cancelled && mounted.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEmergencyLocked || unlockTimer <= 0) return;
    const id = setInterval(() => setUnlockTimer((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(id);
  }, [isEmergencyLocked, unlockTimer]);

  const persist = useCallback(
    async (mindset: Mindset, npt: boolean) => {
      setSaving(true);
      const entry: HealthCheck = { npt, mindset, timestamp: Date.now() };
      const success = await saveHealthCheck(entry);
      if (!mounted.current) return;

      if (success) {
        await luxuryClickVibrate();
        // Functional update: an in-flight fetch must never drop this entry.
        setHistory((prev) => [entry, ...prev.filter((e) => e.timestamp !== entry.timestamp)]);
        setTodayEntry(entry);
        logActivity("health_check", `Check-in · ${mindset}`);
        onUpdate?.();

        if (mindset === "stormy") {
          try {
            localStorage.removeItem(STORMY_KEY);
          } catch {
            /* ignore */
          }
          setIsCompletionConfirmed(false);
          setUnlockTimer(UNLOCK_SECONDS);
          setIsEmergencyLocked(true);
        }
      } else {
        toast.error("Could not save. Check your device storage.");
      }
      setSaving(false);
    },
    [onUpdate],
  );

  // Auto-save once both answers exist and nothing is stored for today yet.
  const autoSaved = useRef(false);
  useEffect(() => {
    if (loading || saving || todayEntry || autoSaved.current) return;
    if (workingMindset && workingNpt !== null) {
      autoSaved.current = true;
      void persist(workingMindset, workingNpt);
    }
  }, [workingMindset, workingNpt, loading, saving, todayEntry, persist]);

  const resolveEmergency = async () => {
    if (!isCompletionConfirmed) return;
    setIsEmergencyLocked(false);
    try {
      localStorage.setItem(STORMY_KEY, "true");
    } catch {
      /* ignore */
    }
    await luxuryClickVibrate();
  };

  const bothAnswered =
    (!!todayEntry || workingMindset !== null) && (!!todayEntry || workingNpt !== null);
  const awaitingSave = bothAnswered && !todayEntry;

  if (loading) return <LoadingBlock label="Loading today's check-in" />;

  if (isEmergencyLocked) {
    if (typeof document === "undefined") return null;
    return createPortal(
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-bg px-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="interrupt-title"
      >
        <div className="w-full max-w-content space-y-6 rounded-lg border border-border bg-surface p-6">
          <div className="space-y-2 text-center">
            <p className="text-label uppercase text-danger">Interrupt</p>
            <h2 id="interrupt-title" className="text-display-l font-semibold text-ink">
              Pause. Reset.
            </h2>
            <p className="text-body-s text-ink-muted">
              A hard moment is the signal to move. Do the next physical thing.
            </p>
          </div>

          <ul className="space-y-2 rounded-md border border-border bg-surface-2 p-4 text-body-s text-ink">
            <li>20 push-ups, or a cold shower, right now.</li>
            <li>Stand up and leave the room for two minutes.</li>
            <li>Name the urge out loud. It fades faster than you expect.</li>
          </ul>

          <label className="flex items-start gap-3 rounded-md border border-border px-4 py-3">
            <input
              type="checkbox"
              checked={isCompletionConfirmed}
              onChange={(e) => {
                void luxuryClickVibrate();
                setIsCompletionConfirmed(e.target.checked);
              }}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--accent))]"
            />
            <span className="text-body-s text-ink">Done — I&apos;m back.</span>
          </label>

          <button
            type="button"
            disabled={!isCompletionConfirmed || unlockTimer > 0}
            onClick={resolveEmergency}
            className="h-12 w-full rounded-md bg-ink text-label uppercase text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {unlockTimer > 0 ? `Continue in ${unlockTimer}s` : "Continue"}
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-body-s font-semibold text-ink">Daily check-in</h2>
            <p className="text-meta text-ink-muted">Private · stored on this device</p>
          </div>
          {todayEntry && (
            <span className="inline-flex items-center gap-1.5 text-meta text-success">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Done
            </span>
          )}
        </div>

        <div className="border-b border-border px-5 py-4">
          <p className="text-label uppercase text-ink-faint">Mind</p>
          <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="How is your mind?">
            {MINDSETS.map(({ value, label, Icon, active }) => {
              const isActive = workingMindset === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    void luxuryClickVibrate();
                    setWorkingMindset(value);
                  }}
                  aria-pressed={isActive}
                  className={cn(
                    "flex h-11 items-center justify-center gap-1.5 rounded-md border text-body-s font-medium transition-colors duration-fast",
                    isActive
                      ? active
                      : "border-border text-ink-muted hover:border-ink-faint hover:text-ink",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-label uppercase text-ink-faint">Body — morning signal</p>
          <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Morning signal">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                void luxuryClickVibrate();
                setWorkingNpt(true);
              }}
              aria-pressed={workingNpt === true}
              className={cn(
                "h-11 rounded-md border text-body-s font-semibold transition-colors duration-fast",
                workingNpt === true
                  ? "border-ink bg-ink text-bg"
                  : "border-border text-ink-muted hover:border-ink-faint hover:text-ink",
              )}
            >
              Present
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                void luxuryClickVibrate();
                setWorkingNpt(false);
              }}
              aria-pressed={workingNpt === false}
              className={cn(
                "h-11 rounded-md border text-body-s font-semibold transition-colors duration-fast",
                workingNpt === false
                  ? "border-danger bg-danger text-on-accent"
                  : "border-border text-ink-muted hover:border-ink-faint hover:text-ink",
              )}
            >
              Absent
            </button>
          </div>
          {awaitingSave && (
            <p className="mt-3 text-meta text-ink-muted" role="status" aria-live="polite">
              Saving…
            </p>
          )}
        </div>
      </div>

      <Dialog open={showMedicalAlert} onOpenChange={setShowMedicalAlert}>
        <DialogContent className="max-w-content rounded-lg border border-border bg-surface p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-section text-ink">
              <AlertCircle className="h-4 w-4 text-warning" aria-hidden="true" />
              A note on your health
            </DialogTitle>
            <DialogDescription className="text-body-s text-ink-muted">
              Two weeks with no morning signal can be a meaningful cardiovascular
              indicator. It is not a diagnosis — it is worth mentioning to a
              doctor at your next visit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <button
              type="button"
              onClick={() => setShowMedicalAlert(false)}
              className="h-11 w-full rounded-md bg-ink text-label uppercase text-bg transition-opacity hover:opacity-90"
            >
              Understood
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}