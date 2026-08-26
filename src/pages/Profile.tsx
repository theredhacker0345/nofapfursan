import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveStreak, fetchStreak, StreakPayload } from "@/services/nostr";
import { getStreakData, saveStreakData } from "@/lib/streakUtils";
import { ArrowLeft, Settings2, ShieldCheck, Network, User } from "lucide-react";
import { useNostr } from "@/hooks/useNostr";
import { IdentityManagement } from "@/components/IdentityManagement";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateOrLoadKeys, clearKeys, NostrKeys } from "@/services/nostr";
import { AvatarUpload } from "@/components/AvatarUpload";
import { BottomNav } from "@/components/BottomNav";
import { LoadingScreen } from "@/components/LoadingScreen";
import { RelaySettings } from "@/components/RelaySettings";
import { SecuritySettings } from "@/components/SecuritySettings";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";
import { Header } from "@/components/Header";

const NOOR_CONNECT_URL = "https://f-droid.org/en/packages/com.noorconnect.app/";

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
        setTimeout(() => setLoading(false), 500);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleCloudSync = async () => {
    if (!identity?.privateKey) {
      toast.error("Authentication required for sync.");
      return;
    }
    setSaving(true);
    try {
      const local = await getStreakData();
      const streakData: StreakPayload = {
        days: local.startDate ? Math.floor((Date.now() - new Date(local.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        startDate: local.startDate,
        longestStreak: local.longestStreak,
        totalRelapses: local.totalRelapses,
        timestamp: Date.now(),
      };
      const success = await saveStreak(streakData);
      if (success) toast.success("Cloud Backup Successful");
    } catch (err) {
      toast.error("Backup Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCloudRestore = async () => {
    if (!identity?.publicKey) return;
    setSaving(true);
    try {
      const remoteStreak = await fetchStreak();
      if (remoteStreak) {
        const local = await getStreakData();
        const merged = {
          startDate: remoteStreak.startDate ?? local.startDate,
          longestStreak: Math.max(local.longestStreak, remoteStreak.longestStreak || 0),
          totalRelapses: Math.max(local.totalRelapses, remoteStreak.totalRelapses || 0),
        };
        await saveStreakData(merged);
        toast.success("Progress Restored");
      } else {
        toast.info("No cloud backup found");
      }
    } catch (err) {
      toast.error("Restore Failed");
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
      localStorage.removeItem('fursan_streak_data');
      localStorage.removeItem('fursan_activity_log');
      if (identity?.publicKey) {
        localStorage.removeItem(`nostr_username_${identity.publicKey}`);
        localStorage.removeItem(`nostr_avatar_${identity.publicKey}`);
      }
      toast.success("Identity Purged");
      navigate("/");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  if (loading || !identity) {
    return <LoadingScreen message="Linking Identity" subMessage="Verifying Cryptographic Keys" />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-lg mx-auto px-4">
        <Header />

        <div className="flex items-center justify-between mb-8 page-transition" style={{ animationDelay: "0.1s" }}>
          <Button variant="outline" onClick={() => navigate("/")} className="rounded-xl border-border bg-card text-foreground hover:bg-secondary h-10 px-4 text-xs font-bold shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-2 bg-secondary text-accent px-3 py-1.5 rounded-full border border-border shadow-sm">
            <ShieldCheck className="w-3 h-3 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Secure Session</span>
          </div>
        </div>

        <div className="royal-card p-0 overflow-visible page-transition" style={{ animationDelay: "0.15s" }}>
          <div className="p-6 border-b border-border bg-secondary/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground tracking-tight">My Profile</h1>
                <p className="text-xs text-muted-foreground">Identity &amp; account</p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-10">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
              <AvatarUpload currentAvatar={avatarUrl} onUploadSuccess={setAvatarUrl} />
              <div className="flex-1 w-full pt-2">
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
            </div>

            <div className="pt-8 space-y-10 border-t border-border">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm px-1">
                  <Network className="w-4 h-4 text-primary" />
                  Relays
                </div>
                <RelaySettings />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm px-1">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Backup &amp; Security
                </div>
                <SecuritySettings />
              </div>

              <button
                onClick={() => navigate("/settings")}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-secondary transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Settings2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">App Settings</span>
                </div>
                <span className="text-xs text-muted-foreground">Themes, reminders, privacy</span>
              </button>
            </div>

            <div className="pt-8 border-t border-border">
              <div className="flex flex-col items-center gap-2 mt-8 text-center">
                <p className="text-xs text-muted-foreground">NoFap Fursan v2.5</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
