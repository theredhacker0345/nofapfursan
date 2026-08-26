import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Palette,
  Download,
  Trash2,
  Mail,
  Heart,
  Copy,
  ExternalLink,
  Moon,
  Shield,
  ChevronRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { ThemeSelector } from "@/components/ThemeSelector";
import { PrivacySettings } from "@/components/PrivacySettings";
import { NotificationToggle } from "@/components/NotificationToggle";
import { exportKeys, clearKeys } from "@/services/nostr";
import { luxuryClickVibrate } from "@/lib/vibrationUtils";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NOOR_CONNECT_URL = "https://f-droid.org/en/packages/com.noorconnect.app/";

export default function Settings() {
  const navigate = useNavigate();
  const { enabled, intervalHours, setIntervalHours, isSupported } = useNotifications();
  const [simpleMode, setSimpleMode] = useState(
    () => localStorage.getItem("fursan_minimalist_mode") === "true",
  );

  useEffect(() => {
    document.body.classList.toggle("minimalist-mode", simpleMode);
    localStorage.setItem("fursan_minimalist_mode", simpleMode.toString());
  }, [simpleMode]);

  const handleExportKey = async () => {
    const keys = await exportKeys();
    if (keys?.nsec) {
      await navigator.clipboard.writeText(keys.nsec);
      toast.success("Key copied to clipboard");
      luxuryClickVibrate();
    } else {
      toast.error("Could not get your key");
    }
  };

  const handleWipeData = () => {
    clearKeys();
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-bg pb-20">
      <div className="mx-auto max-w-screen-sm">
        {/* Page header — minimal */}
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
          <h1 className="text-base font-semibold text-ink">Settings</h1>
          <div className="w-14" />
        </header>

        <main className="px-4">
          <p className="section-title">Appearance</p>
          <div className="card overflow-hidden">
            <ThemeSelector />
            <div className="row justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Simple mode</p>
                <p className="text-xs text-ink-muted">Less decoration, easier to read</p>
              </div>
              <Switch
                checked={simpleMode}
                onCheckedChange={(checked) => {
                  setSimpleMode(checked);
                  luxuryClickVibrate();
                }}
                aria-label="Toggle simple mode"
              />
            </div>
          </div>

          {isSupported && (
            <>
              <p className="section-title">Reminders</p>
              <div className="card overflow-hidden">
                <div className="row">
                  <NotificationToggle />
                </div>
                <div className="px-4 py-3 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-ink">How often</span>
                    <span className="text-sm font-semibold text-ink tabular">{intervalHours}h</span>
                  </div>
                  <Slider
                    value={[intervalHours]}
                    onValueChange={(value) => setIntervalHours(value[0])}
                    min={1}
                    max={24}
                    step={1}
                    disabled={!enabled}
                    aria-label="Reminder frequency in hours"
                    className={cn(!enabled && "opacity-50 cursor-not-allowed")}
                  />
                  <div className="mt-2 flex justify-between text-[11px] text-ink-faint">
                    <span>Every hour</span>
                    <span>Every 24h</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <p className="section-title">Privacy &amp; Security</p>
          <div className="card overflow-hidden">
            <PrivacySettings />
          </div>

          <p className="section-title">Companion app</p>
          <div className="card overflow-hidden">
            <div className="p-4">
              <p className="text-sm text-ink leading-relaxed">
                For prayer times and adhan alerts, try our free companion app Noor Connect.
              </p>
              <Button
                variant="outline"
                onClick={() => window.open(NOOR_CONNECT_URL, "_blank")}
                className="mt-3 w-full"
              >
                Get Noor Connect on F-Droid
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <p className="section-title">Your data</p>
          <div className="card overflow-hidden">
            <button
              onClick={handleExportKey}
              className="row w-full text-left"
            >
              <Download className="h-4 w-4 text-ink-muted" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">Save my private key</p>
                <p className="text-xs text-ink-muted">Back up your identity</p>
              </div>
              <ChevronRight className="h-4 w-4 text-ink-faint" />
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="row w-full text-left hover:bg-danger/5">
                  <Trash2 className="h-4 w-4 text-danger" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-danger">Erase all data</p>
                    <p className="text-xs text-ink-muted">Deletes everything on this device</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-faint" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border border-border bg-bg">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-ink">Erase all data?</AlertDialogTitle>
                  <AlertDialogDescription className="text-ink-muted">
                    This permanently deletes your private key, streak history and all local data.
                    If you have not saved your key, your account cannot be recovered.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="h-11 rounded-full border border-border bg-surface text-ink">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleWipeData}
                    className="h-11 rounded-full bg-danger text-white hover:bg-danger/90"
                  >
                    Erase everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <p className="section-title">Support</p>
          <div className="card overflow-hidden">
            <button
              className="row w-full text-left"
              onClick={() => window.location.href = "mailto:ubaid0345@proton.me"}
            >
              <Mail className="h-4 w-4 text-ink-muted" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">Contact</p>
                <p className="text-xs text-ink-muted">Questions or feedback</p>
              </div>
              <ChevronRight className="h-4 w-4 text-ink-faint" />
            </button>
            <Dialog>
              <DialogTrigger asChild>
                <button className="row w-full text-left">
                  <Heart className="h-4 w-4 text-danger" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">Donate</p>
                    <p className="text-xs text-ink-muted">Support the project</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-faint" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[90%] rounded-2xl bg-surface border border-border">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-center text-ink">Support Fursan</DialogTitle>
                  <DialogDescription className="text-center text-sm text-ink-muted">
                    Help the project grow
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-2 space-y-4">
                  <CryptoField label="Solana (SOL)" address="3Aw78BrsdtBeZNpTQvAP6kjtUpGqDBqhr8dATzEZgp8V" />
                  <CryptoField label="Bitcoin (BTC)" address="bc1q43nelc0skgng752wesq5ez4qzhgl09cksmlddx" />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <p className="pt-8 pb-4 text-center text-xs text-ink-faint">
            Fursan v2.5 · MIT
          </p>
        </main>
      </div>
    </div>
  );
}

function CryptoField({ label, address }: { label: string; address: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    toast.success(`${label} address copied`);
    luxuryClickVibrate();
  };
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <button
        onClick={handleCopy}
        aria-label={`Copy ${label} address`}
        className="mt-1.5 w-full flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2.5 text-left hover:border-ink-faint transition-colors"
      >
        <span className="font-mono text-[11px] text-ink-muted truncate mr-3">{address}</span>
        <Copy className="h-3.5 w-3.5 text-ink-faint flex-shrink-0" />
      </button>
    </div>
  );
}
