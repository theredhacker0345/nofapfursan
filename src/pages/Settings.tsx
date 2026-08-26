import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Palette, Download, Trash2, Mail, Heart, Copy, ExternalLink, Moon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { BottomNav } from "@/components/BottomNav";
import { LoadingScreen } from "@/components/LoadingScreen";
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
    const [loading, setLoading] = useState(true);
    const [simpleMode, setSimpleMode] = useState(() => localStorage.getItem('fursan_minimalist_mode') === 'true');

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 300);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (simpleMode) {
            document.body.classList.add('minimalist-mode');
        } else {
            document.body.classList.remove('minimalist-mode');
        }
        localStorage.setItem('fursan_minimalist_mode', simpleMode.toString());
    }, [simpleMode]);

    const handleExportKey = async () => {
        const keys = await exportKeys();
        if (keys && keys.nsec) {
            await navigator.clipboard.writeText(keys.nsec);
            toast.success("Key Copied", { description: "Your private key was copied to the clipboard." });
            luxuryClickVibrate();
        } else {
            toast.error("Export Failed", { description: "Could not get your key." });
        }
    };

    const handleWipeData = () => {
        clearKeys();
        localStorage.clear();
        window.location.reload();
    };

    if (loading) {
        return <LoadingScreen message="Loading..." subMessage="Opening settings" />;
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <div className="container max-w-lg mx-auto px-4">
                {/* Header */}
                <header className="flex items-center justify-between py-5 page-transition">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/")}
                        aria-label="Go back"
                        className="rounded-xl text-foreground hover:bg-secondary h-10 px-3 text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-lg font-semibold text-foreground">Settings</h1>
                    <div className="w-16" />
                </header>

                <div className="space-y-6 page-transition" style={{ animationDelay: "0.1s" }}>

                    {/* Appearance */}
                    <section className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-container"><Palette className="w-4 h-4 text-on-secondary-container" aria-hidden="true" /></span>
                            <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
                        </div>
                        <div className="px-5 pb-5 space-y-4">
                            <ThemeSelector />
                            <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Simple mode</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Less decoration, easier to read</p>
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
                    </section>

                    {/* Reminders */}
                    {isSupported && (
                        <section className="bg-card border border-border rounded-2xl overflow-hidden">
                            <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-container"><Bell className="w-4 h-4 text-on-secondary-container" aria-hidden="true" /></span>
                                <h2 className="text-sm font-semibold text-foreground">Reminders</h2>
                            </div>
                            <div className="px-5 pb-5 space-y-5">
                                <NotificationToggle />
                                <div className="space-y-3 px-1">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-sm font-medium text-foreground">How often</Label>
                                        <span className="text-sm font-semibold text-primary">{intervalHours}h</span>
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
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Often (1h)</span>
                                        <span>Sometimes (24h)</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Privacy */}
                    <section className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-container"><Moon className="w-4 h-4 text-on-secondary-container" aria-hidden="true" /></span>
                            <h2 className="text-sm font-semibold text-foreground">Privacy &amp; Security</h2>
                        </div>
                        <div className="px-5 pb-5">
                            <PrivacySettings />
                        </div>
                    </section>

                    {/* Companion app */}
                    <section className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-container"><ExternalLink className="w-4 h-4 text-on-secondary-container" aria-hidden="true" /></span>
                            <h2 className="text-sm font-semibold text-foreground">Noor Connect</h2>
                        </div>
                        <div className="px-5 pb-5 space-y-3">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Fursan focuses on your streak and community. For prayer times and adhan alerts, try our free companion app.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full h-12 justify-center gap-2 border-border bg-background hover:bg-secondary text-foreground rounded-xl font-medium"
                                onClick={() => window.open(NOOR_CONNECT_URL, '_blank')}
                            >
                                Get Noor Connect on F-Droid
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>
                    </section>

                    {/* Your data */}
                    <section className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-container"><Download className="w-4 h-4 text-on-secondary-container" aria-hidden="true" /></span>
                            <h2 className="text-sm font-semibold text-foreground">Your Data</h2>
                        </div>
                        <div className="px-5 pb-5 space-y-2">
                            <button
                                onClick={handleExportKey}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-background border border-border hover:bg-secondary transition-colors text-left"
                            >
                                <div>
                                    <p className="text-sm font-medium text-foreground">Save my private key</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Back up your identity to another device</p>
                                </div>
                                <Download className="w-4 h-4 text-muted-foreground" />
                            </button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-background border border-destructive/30 hover:bg-destructive/5 transition-colors text-left">
                                        <div>
                                            <p className="text-sm font-medium text-destructive">Erase all data</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Deletes everything on this device</p>
                                        </div>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl border-border">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Erase all data?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This permanently deletes your private key, streak history and all local data from this device.
                                            If you have not saved your key, your account cannot be recovered.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={handleWipeData}
                                        >
                                            Erase Everything
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </section>

                    {/* Support */}
                    <section className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-container"><Heart className="w-4 h-4 text-on-secondary-container" aria-hidden="true" /></span>
                            <h2 className="text-sm font-semibold text-foreground">Support</h2>
                        </div>
                        <div className="px-5 pb-5 grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                className="h-11 border-border bg-background hover:bg-secondary text-foreground rounded-xl font-medium"
                                onClick={() => window.location.href = 'mailto:ubaid0345@proton.me'}
                            >
                                <Mail className="w-4 h-4 mr-2" /> Contact
                            </Button>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-11 border-border bg-background hover:bg-secondary text-foreground rounded-xl font-medium"
                                    >
                                        <Heart className="w-4 h-4 mr-2 text-destructive" /> Donate
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[90%] rounded-2xl bg-card border border-border">
                                    <DialogHeader>
                                        <DialogTitle className="text-lg font-semibold text-center text-foreground">Support the App</DialogTitle>
                                        <DialogDescription className="text-center text-sm text-muted-foreground">
                                            Help Fursan grow
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 mt-2">
                                        <CryptoField
                                            label="Solana (SOL)"
                                            address="3Aw78BrsdtBeZNpTQvAP6kjtUpGqDBqhr8dATzEZgp8V"
                                        />
                                        <CryptoField
                                            label="Bitcoin (BTC)"
                                            address="bc1q43nelc0skgng752wesq5ez4qzhgl09cksmlddx"
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </section>

                    <p className="text-center text-xs text-muted-foreground pt-2 pb-4">
                        NoFap Fursan v2.5
                    </p>
                </div>
            </div>
            <BottomNav />
        </div>
    );
}

function CryptoField({ label, address }: { label: string, address: string }) {
    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        toast.success("Address Copied", { description: `${label} address ready.` });
        luxuryClickVibrate();
    };

    return (
        <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <button
                onClick={handleCopy}
                aria-label={`Copy ${label} address`}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/40 transition-colors text-left"
            >
                <span className="font-mono text-xs text-muted-foreground truncate mr-3">{address}</span>
                <Copy className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
        </div>
    );
}
