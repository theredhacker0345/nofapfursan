import { useState } from "react";
import {
  Bell,
  Palette,
  Download,
  Trash2,
  Mail,
  Heart,
  Copy,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { Screen, SectionHead } from "@/components/Screen";
import { ThemeSelector } from "@/components/ThemeSelector";
import { PrivacySettings } from "@/components/PrivacySettings";
import { NotificationToggle } from "@/components/NotificationToggle";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { exportKeys, resetIdentity } from "@/services/nostr";
import { luxuryClickVibrate } from "@/lib/vibrationUtils";
import { useNotifications } from "@/hooks/useNotifications";
import { APP_VERSION } from "@/data/version";
import { cn } from "@/lib/utils";

const NOOR_CONNECT_URL = "https://f-droid.org/en/packages/com.noorconnect.app/";
const CONTACT_EMAIL = "ubaid0345@proton.me";

export default function Settings() {
  const { enabled, intervalHours, setIntervalHours, isSupported } = useNotifications();
  const [erasing, setErasing] = useState(false);

  const handleExportKey = async () => {
    const keys = await exportKeys();
    if (!keys?.nsec) {
      toast.error("Could not read your key");
      return;
    }
    try {
      await navigator.clipboard.writeText(keys.nsec);
      toast.success("Private key copied — store it somewhere offline");
      void luxuryClickVibrate();
    } catch {
      toast.error("Clipboard blocked. Long-press to select manually.");
    }
  };

  /**
   * Targeted wipe. `clearKeys()` used to call `localStorage.clear()`, which on web
   * destroyed the unsynced offline queue and on Android erased nothing but the
   * key — so the promise in the dialog was never true on either platform.
   */
  const handleErase = async () => {
    setErasing(true);
    try {
      await resetIdentity({ wipeRecords: true });
      toast.success("Everything on this device has been erased");
      setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      console.error("Erase failed", error);
      toast.error("Could not erase. Clear app data from system settings instead.");
      setErasing(false);
    }
  };

  return (
    <Screen title="Settings" subtitle="Appearance, reminders, privacy">
      <SectionHead>Appearance</SectionHead>
      <div className="surface-group">
        <ThemeSelector />
      </div>

      {isSupported && (
        <>
          <SectionHead>Reminders</SectionHead>
          <div className="surface-group">
            <div className="row">
              <NotificationToggle />
            </div>
            <div className="border-t border-border px-5 py-4">
              <div className="flex items-center justify-between">
                <label htmlFor="reminder-interval" className="text-body-s font-medium text-ink">
                  How often
                </label>
                <span className="font-data text-data-lg text-ink">{intervalHours}h</span>
              </div>
              <Slider
                id="reminder-interval"
                value={[intervalHours]}
                onValueChange={(value) => setIntervalHours(value[0] ?? 24)}
                min={1}
                max={24}
                step={1}
                disabled={!enabled}
                aria-label="Reminder frequency in hours"
                className={cn("mt-3", !enabled && "opacity-50")}
              />
              <div className="mt-2 flex justify-between text-meta text-ink-faint">
                <span>Every hour</span>
                <span>Every 24h</span>
              </div>
            </div>
          </div>
        </>
      )}

      <SectionHead>Privacy</SectionHead>
      <div className="surface-group">
        <PrivacySettings />
      </div>

      <SectionHead>Companion</SectionHead>
      <div className="surface-group">
        <a
          href={NOOR_CONNECT_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="row"
        >
          <Bell className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-body-s font-medium text-ink">Noor Connect</span>
            <span className="block text-meta text-ink-muted">
              Prayer times and adhan, on F-Droid
            </span>
          </span>
          <ExternalLink className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
        </a>
      </div>

      <SectionHead>Your key</SectionHead>
      <div className="surface-group">
        <button type="button" onClick={handleExportKey} className="row">
          <Download className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-body-s font-medium text-ink">Back up my private key</span>
            <span className="block text-meta text-ink-muted">
              The only way to restore this account on a new device
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
        </button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button type="button" className="row hover:bg-danger/5">
              <Trash2 className="h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-body-s font-medium text-danger">Erase everything</span>
                <span className="block text-meta text-ink-muted">
                  Key, streak, journal and check-ins on this device
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-lg border border-border bg-surface">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-section text-ink">Erase everything?</AlertDialogTitle>
              <AlertDialogDescription className="text-body-s text-ink-muted">
                This permanently deletes your private key, streak, journal entries and
                any records still waiting to sync. Without a backup of your key, the
                account cannot be restored.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="h-11 rounded-md border border-border bg-surface text-label uppercase text-ink hover:bg-surface-2">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void handleErase();
                }}
                disabled={erasing}
                className="h-11 rounded-md bg-danger text-label uppercase text-on-accent hover:opacity-90"
              >
                {erasing ? "Erasing…" : "Erase everything"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <SectionHead>Support</SectionHead>
      <div className="surface-group">
        <a href={`mailto:${CONTACT_EMAIL}`} className="row">
          <Mail className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-body-s font-medium text-ink">Contact</span>
            <span className="block truncate text-meta text-ink-muted">{CONTACT_EMAIL}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
        </a>

        <Dialog>
          <DialogTrigger asChild>
            <button type="button" className="row">
              <Heart className="h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-body-s font-medium text-ink">Support the project</span>
                <span className="block text-meta text-ink-muted">Fursan is free and open source</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-content rounded-lg border border-border bg-surface">
            <DialogHeader>
              <DialogTitle className="text-section text-ink">Support Fursan</DialogTitle>
              <DialogDescription className="text-body-s text-ink-muted">
                No ads, no trackers, no funding. If it helped you, a contribution keeps it
                shipping.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-4">
              <CryptoField label="Solana" address="3Aw78BrsdtBeZNpTQvAP6kjtUpGqDBqhr8dATzEZgp8V" />
              <CryptoField label="Bitcoin" address="bc1q43nelc0skgng752wesq5ez4qzhgl09cksmlddx" />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="flex items-center justify-center gap-2 pb-4 pt-8 text-meta text-ink-faint">
        <Palette className="h-3 w-3" aria-hidden="true" />
        Fursan {APP_VERSION} · MIT
      </p>
    </Screen>
  );
}

function CryptoField({ label, address }: { label: string; address: string }) {
  return (
    <div>
      <p className="text-label uppercase text-ink-faint">{label}</p>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(address);
          toast.success(`${label} address copied`);
          void luxuryClickVibrate();
        }}
        aria-label={`Copy ${label} address`}
        className="mt-1.5 flex w-full items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-left transition-colors hover:border-ink-faint"
      >
        <span className="break-all font-data text-meta text-ink-muted">{address}</span>
        <Copy className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
      </button>
    </div>
  );
}

