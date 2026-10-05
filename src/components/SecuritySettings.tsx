import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Eye, EyeOff, AlertTriangle, Download, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { exportKeys, importKey, fetchStreak } from "@/services/nostr";
import { saveStreakData } from "@/lib/streakUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const HOLD_MS = 900;

/**
 * Hold-to-reveal for the private key. The mechanism was sound; the presentation
 * was a black-on-white brutalist block (`border-black rounded-none bg-gray-50`)
 * that fought the rest of the product. Now token-driven, with the reveal still
 * requiring a deliberate press-and-hold on touch or mouse.
 */
export function SecuritySettings() {
  const [keys, setKeys] = useState<{ nsec: string; npub: string } | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [importNsec, setImportNsec] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);

  const loadKeys = useCallback(async () => {
    setKeys(await exportKeys());
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  const cancelHold = useCallback(() => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    setHoldProgress(0);
  }, []);

  useEffect(() => cancelHold, [cancelHold]);

  const startHold = () => {
    if (isRevealed) {
      setIsRevealed(false);
      return;
    }
    cancelHold();
    startedAt.current = performance.now();
    holdTimer.current = setInterval(() => {
      const elapsed = performance.now() - startedAt.current;
      setHoldProgress(Math.min(100, (elapsed / HOLD_MS) * 100));
      if (elapsed >= HOLD_MS) {
        setIsRevealed(true);
        cancelHold();
      }
    }, 40);
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Clipboard blocked");
    }
  };

  const download = () => {
    if (!keys) return;
    const blob = new Blob(
      [`Fursan identity backup\n\nnsec (private, never share): ${keys.nsec}\nnpub (public): ${keys.npub}\n`],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fursan-identity-backup.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup file saved");
  };

  const runImport = async () => {
    const trimmed = importNsec.trim();
    if (!trimmed.startsWith("nsec1")) {
      toast.error("That is not an nsec. It has to start with nsec1.");
      return;
    }
    setLoading(true);
    try {
      await importKey(trimmed);
      setImportOpen(false);
      setImportNsec("");
      setIsRevealed(false);

      const remote = await fetchStreak();
      if (remote) {
        await saveStreakData({
          startDate: remote.startDate,
          longestStreak: remote.longestStreak,
          totalRelapses: remote.totalRelapses,
          updatedAt: remote.updatedAt || remote.timestamp || Date.now(),
        });
        toast.success("Identity restored with your streak");
        setTimeout(() => window.location.reload(), 900);
      } else {
        toast.success("Identity restored", {
          description: "No cloud streak was found for this key — starting fresh.",
        });
        setTimeout(() => window.location.reload(), 900);
      }
    } catch (error) {
      console.error("[Identity] Import failed", error);
      toast.error("Could not import that key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="nsec-field" className="text-label uppercase text-ink-faint">
            Private key
          </label>
          <span className="text-meta text-ink-faint">
            {isRevealed ? "visible" : "hold to reveal"}
          </span>
        </div>

        <div
          className="relative mt-2 overflow-hidden rounded-md border border-border bg-surface-2 px-3 py-2.5"
          role="group"
        >
          <span id="nsec-field" className="block break-all font-data text-data text-ink-muted">
            {isRevealed && keys ? keys.nsec : "•".repeat(48)}
          </span>
          {holdProgress > 0 && (
            <span
              className="absolute inset-y-0 left-0 bg-accent/10 transition-[width] duration-75 ease-linear"
              style={{ width: `${holdProgress}%` }}
              aria-hidden="true"
            />
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onPointerDown={startHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            onPointerCancel={cancelHold}
            onContextMenu={(e) => e.preventDefault()}
            className="inline-flex h-11 select-none touch-none items-center gap-1.5 rounded-md border border-border px-4 text-label uppercase text-ink transition-colors hover:bg-surface-2"
          >
            {isRevealed ? (
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isRevealed ? "Hide" : "Hold to reveal"}
          </button>

          <button
            type="button"
            disabled={!isRevealed || !keys}
            onClick={() => keys && void copy(keys.nsec, "Private key")}
            className="inline-flex h-11 items-center gap-1.5 rounded-md border border-border px-4 text-label uppercase text-ink transition-colors hover:bg-surface-2 disabled:opacity-40"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy
          </button>

          <button
            type="button"
            disabled={!isRevealed || !keys}
            onClick={download}
            className="inline-flex h-11 items-center gap-1.5 rounded-md border border-border px-4 text-label uppercase text-ink transition-colors hover:bg-surface-2 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            File
          </button>
        </div>

        <p className="mt-3 inline-flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-meta text-ink-muted">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
          Never share your nsec. Nobody — including us — can recover it for you.
        </p>
      </div>

      <div className="px-5 py-4">
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border text-label uppercase text-ink transition-colors hover:bg-surface-2"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              Restore an existing identity
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-content rounded-lg border border-border bg-surface">
            <DialogHeader>
              <DialogTitle className="text-section text-ink">Restore identity</DialogTitle>
              <DialogDescription className="text-body-s text-ink-muted">
                Paste the nsec you backed up. This replaces the identity on this
                device and pulls your streak from the relays.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <label htmlFor="nsec-import" className="text-label uppercase text-ink-faint">
                nsec
              </label>
              <input
                id="nsec-import"
                value={importNsec}
                onChange={(e) => setImportNsec(e.target.value)}
                placeholder="nsec1…"
                autoComplete="off"
                spellCheck={false}
                className="mt-2 h-12 w-full rounded-md border border-border bg-surface-2 px-3 font-data text-data text-ink placeholder:text-ink-faint"
              />
            </div>

            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="h-11 rounded-md border border-border text-label uppercase text-ink hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void runImport()}
                disabled={!importNsec.trim() || loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-5 text-label uppercase text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                Restore and sync
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}