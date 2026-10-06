import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight, Upload, Download, LogOut, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { Screen, SectionHead } from "@/components/Screen";
import { RelaySettings } from "@/components/RelaySettings";
import { SecuritySettings } from "@/components/SecuritySettings";
import { AvatarUpload } from "@/components/AvatarUpload";
import { LoadingScreen } from "@/components/LoadingScreen";
import { EmptyState } from "@/components/EmptyState";
import {
  generateOrLoadKeys,
  discardIdentity,
  saveStreak,
  fetchStreak,
  resetIdentity,
  type NostrKeys,
} from "@/services/nostr";
import { getStreakData, daysSinceStart } from "@/lib/streakUtils";
import { APP_VERSION } from "@/data/version";
import { luxuryClickVibrate } from "@/lib/vibrationUtils";

export default function Profile() {
  const [identity, setIdentity] = useState<NostrKeys | null>(null);
  const [alias, setAlias] = useState("");
  const [loading, setLoading] = useState(true);
  const [broken, setBroken] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setBroken(false);
    try {
      const id = await generateOrLoadKeys();
      setIdentity(id);
      setAlias(localStorage.getItem(`nostr_username_${id.publicKey}`) ?? "");
    } catch (error) {
      console.error("[Profile] Identity unavailable", error);
      setBroken(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveAlias = async (value: string) => {
    if (!identity) return;
    setAlias(value);
    try {
      localStorage.setItem(`nostr_username_${identity.publicKey}`, value);
      void luxuryClickVibrate();
    } catch {
      toast.error("Could not save your alias");
    }
  };

  /** Explicit, reversible-by-choice backup. */
  const backupNow = async () => {
    setBusy(true);
    try {
      const local = await getStreakData();
      const ok = await saveStreak({
        days: local.startDate ? daysSinceStart(local.startDate) : 0,
        startDate: local.startDate,
        longestStreak: local.longestStreak,
        totalRelapses: local.totalRelapses,
        updatedAt: local.updatedAt,
        timestamp: local.updatedAt,
      });
      toast[ok ? "success" : "error"](ok ? "Backed up to the relays" : "Backup failed");
    } finally {
      setBusy(false);
    }
  };

  /**
   * Restore only offers a remote copy that is genuinely newer, and says plainly
   * that it overwrites the local streak. Previously it installed whatever came
   * back — including a 30-day-old record over a 3-day-old local one.
   */
  const restoreFromCloud = async () => {
    setBusy(true);
    try {
      const local = await getStreakData();
      const remote = await fetchStreak();
      if (!remote) {
        toast("No backup found on the relays");
        return;
      }
      const remoteAt = remote.updatedAt || remote.timestamp || 0;
      if (remoteAt <= local.updatedAt) {
        toast("Your backup is older than this device", {
          description: "Nothing to restore.",
        });
        return;
      }
      const ok = window.confirm(
        `Restore the backup from ${new Date(remoteAt).toLocaleDateString()}?\n\nThis replaces the streak stored on this device.`,
      );
      if (!ok) return;
      const { saveStreakData } = await import("@/lib/streakUtils");
      await saveStreakData({
        startDate: remote.startDate,
        longestStreak: remote.longestStreak,
        totalRelapses: remote.totalRelapses,
        updatedAt: remoteAt,
      });
      toast.success("Streak restored");
    } finally {
      setBusy(false);
    }
  };

  const clearIdentity = async () => {
    try {
      await resetIdentity();
      toast.success("Identity removed from this device");
      setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      console.error("[Profile] Identity clear failed", error);
      toast.error("Could not clear the identity. Try again.");
    }
  };

  if (loading) return <LoadingScreen message="Loading" subMessage="Verifying identity" />;

  if (broken) {
    return (
      <Screen title="Profile" back>
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" aria-hidden="true" />}
          title="Your identity could not be read"
          description="The stored key is damaged or the device storage is unavailable. You can discard it and start a fresh identity — anything already on the relays stays there, encrypted, until you import a key again."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => void load()}
                className="h-11 rounded-md border border-border px-5 text-label uppercase text-ink hover:bg-surface-2"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={async () => {
                  await discardIdentity();
                  await load();
                }}
                className="h-11 rounded-md bg-ink px-5 text-label uppercase text-bg hover:opacity-90"
              >
                Start fresh
              </button>
            </div>
          }
        />
      </Screen>
    );
  }

  if (!identity) return <LoadingScreen message="Loading" />;

  return (
    <Screen title="Profile" subtitle={identity.publicKey.slice(0, 16) + "…"}>
      <section className="flex items-center gap-4">
        <AvatarUpload
          currentAvatar={localStorage.getItem(`nostr_avatar_${identity.publicKey}`) ?? ""}
          storageKey={`nostr_avatar_${identity.publicKey}`}
          onUploadSuccess={() => window.location.reload()}
        />
        <div className="min-w-0 flex-1">
          <label htmlFor="alias" className="text-label uppercase text-ink-faint">
            Display name
          </label>
          <input
            id="alias"
            defaultValue={alias}
            maxLength={40}
            placeholder="Unnamed"
            onBlur={(e) => void saveAlias(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-body-s text-ink placeholder:text-ink-faint"
          />
          <p className="mt-1.5 text-meta text-ink-faint">Kept on this device only.</p>
        </div>
      </section>

      <SectionHead>Backup</SectionHead>
      <div className="surface-group">
        <button type="button" onClick={() => void backupNow()} disabled={busy} className="row">
          <Upload className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-body-s font-medium text-ink">Back up now</span>
            <span className="block text-meta text-ink-muted">
              Encrypted copy to the relays
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => void restoreFromCloud()}
          disabled={busy}
          className="row"
        >
          <Download className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-body-s font-medium text-ink">Restore from backup</span>
            <span className="block text-meta text-ink-muted">
              Only offered when the backup is newer
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
        </button>
      </div>

      <SectionHead>Relays</SectionHead>
      <div className="surface-group">
        <RelaySettings />
      </div>

      <SectionHead>Identity</SectionHead>
      <div className="surface-group">
        <SecuritySettings />
      </div>

      <SectionHead>App</SectionHead>
      <div className="surface-group">
        <Link to="/settings" className="row">
          <Settings2 className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-body-s font-medium text-ink">App settings</span>
            <span className="block text-meta text-ink-muted">Themes, reminders, privacy</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
        </Link>
        <Link to="/library" className="row">
          <BookOpen className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-body-s font-medium text-ink">Library</span>
            <span className="block text-meta text-ink-muted">Guides and practice</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
        </Link>
        <Link to="/nutrition" className="row">
          <Activity className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-body-s font-medium text-ink">Nutrition</span>
            <span className="block text-meta text-ink-muted">Meals and macros</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
        </Link>
        <button type="button" onClick={() => void clearIdentity()} className="row hover:bg-danger/5">
          <LogOut className="h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-body-s font-medium text-danger">Clear identity</span>
            <span className="block text-meta text-ink-muted">
              Removes the key; keeps your local records
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
        </button>
      </div>

      <p className="pb-4 pt-8 text-center text-meta text-ink-faint">Fursan {APP_VERSION} · MIT</p>
    </Screen>
  );
}