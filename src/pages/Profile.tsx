import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveStreak, fetchStreak, StreakPayload } from "@/services/nostr";
import { getStreakData, saveStreakData } from "@/lib/streakUtils";
import { ArrowLeft, Settings, ChevronRight, Network, ShieldCheck, LogOut, User } from "lucide-react";
import { useNostr } from "@/hooks/useNostr";
import { IdentityManagement } from "@/components/IdentityManagement";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateOrLoadKeys, clearKeys, NostrKeys } from "@/services/nostr";
import { AvatarUpload } from "@/components/AvatarUpload";
import { LoadingScreen } from "@/components/LoadingScreen";
import { RelaySettings } from "@/components/RelaySettings";
import { SecuritySettings } from "@/components/SecuritySettings";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

const Profile = () => {
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [identity, setIdentity] = useState<NostrKeys | null>(null);
  const navigate = useNavigate();
  const { publish, updateProfileName, pool } = useNostr();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const id = await generateOrLoadKeys();
        setIdentity(id);

        const storedUsername = localStorage.getItem(`nostr_username_${id?.publicKey}`);
        const storedAvatar = localStorage.getItem(`nostr_avatar_${id?.publicKey}`);
        setUsername(storedUsername || "");
        setAvatarUrl(storedAvatar || "");
      } catch (e) {
        console.error("Failed to load identity", e);
        navigate("/auth");
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleCloudSync = async () => {
    if (!identity?.privateKey) {
      toast.error("Authentication required");
      return;
    }
    setSaving(true);
    try {
      const local = await getStreakData();
      const streakData: StreakPayload = {
        days: local.startDate
          ? Math.floor((Date.now() - new Date(local.startDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        startDate: local.startDate,
        longestStreak: local.longestStreak,
        totalRelapses: local.totalRelapses,
        timestamp: Date.now(),
      };
      const ok = await saveStreak(streakData);
      if (ok) toast.success("Backup saved");
      else toast.error("Backup failed");
    } catch {
      toast.error("Backup failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCloudRestore = async () => {
    if (!identity?.publicKey) return;
    setSaving(true);
    try {
      const remote = await fetchStreak();
      if (remote) {
        const local = await getStreakData();
        const merged = {
          startDate: remote.startDate ?? local.startDate,
          longestStreak: Math.max(local.longestStreak, remote.longestStreak || 0),
          totalRelapses: Math.max(local.totalRelapses, remote.totalRelapses || 0),
        };
        await saveStreakData(merged);
        toast.success("Progress restored");
      } else {
        toast.info("No cloud backup found");
      }
    } catch {
      toast.error("Restore failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
      await clearKeys();
      localStorage.removeItem("fursan_streak_data");
      localStorage.removeItem("fursan_activity_log");
      if (identity?.publicKey) {
        localStorage.removeItem(`nostr_username_${identity.publicKey}`);
        localStorage.removeItem(`nostr_avatar_${identity.publicKey}`);
      }
      toast.success("Identity cleared");
      navigate("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  if (loading || !identity) {
    return <LoadingScreen message="Loading" subMessage="Verifying identity" />;
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-bg/95 px-4 py-3 backdrop-blur-md border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          aria-label="Go back"
          className="text-ink"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-base font-semibold text-ink">Profile</h1>
        <div className="w-14" />
      </header>

      <main className="mx-auto max-w-screen-sm px-4">
        {/* Identity card */}
        <section className="py-6 flex items-center gap-4">
          <AvatarUpload currentAvatar={avatarUrl} onUploadSuccess={setAvatarUrl} />
          <div className="flex-1 min-w-0">
            <IdentityManagement
              userPrivateKey={identity.privateKeyHex}
              pool={pool}
              initialAlias={username}
              onUpdateSuccess={(newName) => {
                setUsername(newName);
                localStorage.setItem(`nostr_username_${identity.publicKey}`, newName);
              }}
              onSync={handleCloudSync}
              onFetch={handleCloudRestore}
            />
          </div>
        </section>

        <p className="section-title">Network</p>
        <div className="card overflow-hidden">
          <RelaySettings />
        </div>

        <p className="section-title">Backup &amp; Security</p>
        <div className="card overflow-hidden">
          <SecuritySettings />
        </div>

        <p className="section-title">App</p>
        <div className="card overflow-hidden">
          <button
            onClick={() => navigate("/settings")}
            className="row w-full text-left"
          >
            <Settings className="h-4 w-4 text-ink-muted" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">App settings</p>
              <p className="text-xs text-ink-muted">Themes, reminders, privacy</p>
            </div>
            <ChevronRight className="h-4 w-4 text-ink-faint" />
          </button>
        </div>

        <p className="section-title">Session</p>
        <div className="card overflow-hidden">
          <button
            onClick={handleLogout}
            className="row w-full text-left hover:bg-danger/5"
          >
            <LogOut className="h-4 w-4 text-danger" />
            <div className="flex-1">
              <p className="text-sm font-medium text-danger">Clear identity</p>
              <p className="text-xs text-ink-muted">Removes your key from this device</p>
            </div>
            <ChevronRight className="h-4 w-4 text-ink-faint" />
          </button>
        </div>

        <p className="pt-8 pb-4 text-center text-xs text-ink-faint">
          Fursan v2.5 · MIT
        </p>
      </main>
    </div>
  );
};

export default Profile;
