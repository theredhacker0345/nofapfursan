import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { saveHealthCheck, fetchHealthChecks, HealthCheck } from "@/services/nostr";
import { Sun, Cloud, CloudLightning, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { luxuryClickVibrate } from "@/lib/vibrationUtils";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";
import { generateOrLoadKeys } from "@/services/nostr";

interface DailyCheckinCardProps {
  onUpdate?: () => void;
  days?: number;
}

type Mindset = "sharp" | "foggy" | "stormy";

const MINDSETS: { value: Mindset; label: string; Icon: typeof Sun }[] = [
  { value: "sharp", label: "Sharp", Icon: Sun },
  { value: "foggy", label: "Foggy", Icon: Cloud },
  { value: "stormy", label: "Stormy", Icon: CloudLightning },
];

/**
 * One card, two rows. Mind check-in (segmented) and body check-in
 * (Yes / No) both render in the same surface — no more two-stacked
 * cards with redundant headers.
 */
export function DailyCheckinCard({ onUpdate, days = 0 }: DailyCheckinCardProps) {
  const [history, setHistory] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMedicalAlert, setShowMedicalAlert] = useState(false);
  const [isEmergencyLocked, setIsEmergencyLocked] = useState(false);
  const [isCompletionConfirmed, setIsCompletionConfirmed] = useState(false);
  const [unlockTimer, setUnlockTimer] = useState(5);
  const [todayEntry, setTodayEntry] = useState<HealthCheck | null>(null);

  // Local working state (not yet persisted)
  const [workingMindset, setWorkingMindset] = useState<Mindset | null>(null);
  const [workingNpt, setWorkingNpt] = useState<boolean | null>(null);

  const [userName, setUserName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const identity = await generateOrLoadKeys();
      if (identity?.publicKey) {
        const storedName = localStorage.getItem(`nostr_username_${identity.publicKey}`);
        const storedAvatar = localStorage.getItem(`nostr_avatar_${identity.publicKey}`);
        setUserName(storedName || "");
        setAvatarUrl(storedAvatar || null);
      }
    };
    load();
  }, []);

  useEffect(() => {
    loadHealthData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  // Lock-screen countdown
  useEffect(() => {
    if (!isEmergencyLocked || unlockTimer <= 0) return;
    const t = setInterval(() => setUnlockTimer((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [isEmergencyLocked, unlockTimer]);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const data = await fetchHealthChecks();
      setHistory(data);

      const today = new Date().toDateString();
      const todayRec = data.find((e) => new Date(e.timestamp).toDateString() === today) ?? null;
      setTodayEntry(todayRec);
      setWorkingMindset(todayRec?.mindset ?? null);
      setWorkingNpt(todayRec?.npt ?? null);

      // Lock screen if last check was stormy and not resolved today
      const lastStormy =
        todayRec?.mindset === "stormy" ||
        (data[0] && data[0].mindset === "stormy" && !localStorage.getItem("fursan_stormy_resolved"));
      if (lastStormy && !localStorage.getItem("fursan_stormy_resolved")) {
        setIsEmergencyLocked(true);
      }

      // Medical alert: 14 consecutive recent days with NPT = false
      if (days >= 4) {
        const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        const last14 = data.filter((e) => e.timestamp >= fourteenDaysAgo).slice(0, 14);
        if (last14.length >= 14 && last14.every((e) => !e.npt)) {
          setShowMedicalAlert(true);
        }
      }
    } catch (e) {
      console.error("Failed to load health data", e);
    } finally {
      setLoading(false);
    }
  };

  const persist = async (mindset: Mindset, npt: boolean) => {
    setSaving(true);
    const entry: HealthCheck = {
      npt,
      mindset,
      timestamp: Date.now(),
    };
    const success = await saveHealthCheck(entry);
    if (success) {
      await luxuryClickVibrate();
      toast.success("Saved");
      logActivity("health_check", `Daily Check: mindset=${mindset}, npt=${npt}`);
      setTodayEntry(entry);
      setHistory([entry, ...history]);
      if (mindset === "stormy") {
        localStorage.removeItem("fursan_stormy_resolved");
        setIsEmergencyLocked(true);
        setUnlockTimer(5);
        setIsCompletionConfirmed(false);
      }
      if (onUpdate) onUpdate();
    } else {
      toast.error("Could not save. Try again.");
    }
    setSaving(false);
  };

  // Auto-save when both selections are made (today's first check-in)
  useEffect(() => {
    if (loading || saving) return;
    if (todayEntry) return; // already saved for today
    if (workingMindset && workingNpt !== null) {
      persist(workingMindset, workingNpt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingMindset, workingNpt, loading, todayEntry]);

  const resolveEmergency = async () => {
    if (!isCompletionConfirmed) return;
    setIsEmergencyLocked(false);
    localStorage.setItem("fursan_stormy_resolved", "true");
    toast.success("Back to it.");
    await luxuryClickVibrate();
  };

  if (loading) return null;

  /* ── Emergency lock overlay ─────────────────────────────── */
  if (isEmergencyLocked) {
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 p-6 backdrop-blur-md">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-danger/40 bg-black p-8 text-center">
          <CloudLightning className="mx-auto h-14 w-14 text-danger animate-pulse" />
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Pause. Reset.</h2>
            <p className="text-sm text-white/60">A hard moment — that's the signal to act.</p>
          </div>
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-left">
            <p className="text-sm font-medium text-white/90">
              Do <span className="font-semibold text-white">20 push-ups</span> or take a{" "}
              <span className="font-semibold text-white">cold shower</span> right now.
            </p>
          </div>
          <label className="flex items-center justify-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              checked={isCompletionConfirmed}
              onChange={(e) => {
                luxuryClickVibrate();
                setIsCompletionConfirmed(e.target.checked);
              }}
              className="h-4 w-4 rounded border-danger/40 bg-black accent-danger"
            />
            Done — I'm back.
          </label>
          <Button
            disabled={!isCompletionConfirmed || unlockTimer > 0}
            onClick={resolveEmergency}
            className="h-12 w-full rounded-xl bg-danger text-white hover:bg-danger/90 disabled:opacity-30"
          >
            {unlockTimer > 0 ? `${unlockTimer}s` : "Continue"}
          </Button>
        </div>
      </div>,
      document.body,
    );
  }

  const mindDone = !!todayEntry || workingMindset !== null;
  const bodyDone = !!todayEntry || workingNpt !== null;

  return (
    <>
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={avatarUrl} name={userName} size="sm" />
            <div>
              <p className="text-[13px] font-semibold tracking-tight text-ink">Daily check-in</p>
              <p className="text-[10px] font-medium text-ink-muted">Mind & body</p>
            </div>
          </div>
          {todayEntry && (
            <p className="text-[11px] font-medium text-ink-muted flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Done
            </p>
          )}
        </div>

        {/* Mind row */}
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">How's your mind?</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {MINDSETS.map(({ value, label, Icon }) => {
              const active = workingMindset === value;
              return (
                <button
                  key={value}
                  disabled={saving}
                  onClick={() => setWorkingMindset(value)}
                  aria-pressed={active}
                  aria-label={`Feeling ${label}`}
                  className={cn(
                    "flex items-center justify-center gap-1.5 h-11 rounded-full text-[13px] font-medium transition-colors",
                    active
                      ? value === "stormy"
                        ? "bg-danger text-white"
                        : "bg-ink text-bg"
                      : "border border-border text-ink-muted hover:border-ink-faint hover:text-ink",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body row */}
        <div className="px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Body signal this morning?</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              disabled={saving}
              onClick={() => setWorkingNpt(true)}
              aria-pressed={workingNpt === true}
              className={cn(
                "h-11 rounded-full text-[14px] font-semibold transition-colors",
                workingNpt === true
                  ? "bg-ink text-bg"
                  : "border border-border text-ink-muted hover:border-ink-faint hover:text-ink",
              )}
            >
              Yes
            </button>
            <button
              disabled={saving}
              onClick={() => setWorkingNpt(false)}
              aria-pressed={workingNpt === false}
              className={cn(
                "h-11 rounded-full text-[14px] font-semibold transition-colors",
                workingNpt === false
                  ? "bg-danger text-white"
                  : "border border-border text-ink-muted hover:border-ink-faint hover:text-ink",
              )}
            >
              No
            </button>
          </div>
        </div>

        {/* Saving indicator */}
        {(mindDone && bodyDone && !todayEntry) && (
          <div className="px-5 py-2.5 border-t border-border text-[11px] text-ink-muted">
            Saving…
          </div>
        )}
      </div>

      <Dialog open={showMedicalAlert} onOpenChange={setShowMedicalAlert}>
        <DialogContent className="max-w-md rounded-2xl border border-border bg-bg p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ink">
              <AlertCircle className="h-5 w-5 text-warning" /> A health note
            </DialogTitle>
            <DialogDescription className="text-ink-muted">
              We noticed two weeks with no body signal. This can be a useful
              indicator of cardiovascular health — consider a check-up with a doctor.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              onClick={() => setShowMedicalAlert(false)}
              className="h-11 w-full rounded-xl bg-ink text-bg hover:bg-ink/90"
            >
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
