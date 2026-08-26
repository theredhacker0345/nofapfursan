import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "./ThemeSelector";
import { PrivacySettings } from "./PrivacySettings";
import { NotificationToggle } from "./NotificationToggle";
import { Switch } from "@/components/ui/switch";
import { exportKeys, clearKeys } from "@/services/nostr";
import { luxuryClickVibrate } from "@/lib/vibrationUtils";
import { toast } from "sonner";
import {
    Settings,
    Bell,
    Palette,
    Download,
    Trash2,
    ChevronRight,
    Fingerprint,
    Lock,
    Mail,
    Heart,
    Copy,
    ExternalLink,
    Moon
} from "lucide-react";
import { cn } from "@/lib/utils";

const NOOR_CONNECT_URL = "https://f-droid.org/en/packages/com.noorconnect.app/";

export function SettingsDialog() {
    const [minimalist, setMinimalist] = useState(() => {
        return localStorage.getItem('fursan_minimalist_mode') === 'true';
    });

    useEffect(() => {
        if (minimalist) {
            document.body.classList.add('minimalist-mode');
        } else {
            document.body.classList.remove('minimalist-mode');
        }
        localStorage.setItem('fursan_minimalist_mode', minimalist.toString());
    }, [minimalist]);

    const handleExportKey = async () => {
        const keys = await exportKeys();
        if (keys && keys.nsec) {
            await navigator.clipboard.writeText(keys.nsec);
            toast.success("Key Copied", {
                description: "Your private key was copied to the clipboard."
            });
            luxuryClickVibrate();
        } else {
            toast.error("Export Failed", { description: "Could not get your key." });
        }
    };

    const handleWipeData = () => {
        if (window.confirm("This will erase all data on this device and create a fresh start. Are you sure?")) {
            clearKeys();
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open settings"
                    className="w-12 h-12 rounded-full border-2 border-primary/40 bg-card hover:bg-secondary text-primary transition-all active:scale-90"
                    onClick={() => luxuryClickVibrate()}
                >
                    <Settings className="w-6 h-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-[95%] rounded-[2.5rem] bg-background border-2 border-border shadow-[0_0_50px_hsl(var(--foreground)/0.1)] overflow-hidden p-0 h-[85vh]">
                <div className="bg-gradient-to-b from-secondary/20 to-background p-8 space-y-6 h-full overflow-y-auto custom-scrollbar">
                    <DialogHeader className="text-center space-y-2">
                        <div className="w-16 h-16 rounded-2xl bg-card border-2 border-border flex items-center justify-center mx-auto shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <DialogTitle className="text-3xl font-black text-foreground uppercase tracking-tighter">Settings</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">Make the app yours</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Privacy */}
                        <DropdownSection
                            icon={<Fingerprint className="w-4 h-4 text-primary" />}
                            title="Privacy & Security"
                            description="Encryption and your identity"
                        >
                            <PrivacySettings />
                        </DropdownSection>

                        {/* Notifications */}
                        <DropdownSection
                            icon={<Bell className="w-4 h-4 text-primary" />}
                            title="Reminders"
                            description="Motivation alerts"
                        >
                            <div className="pt-2">
                                <NotificationToggle />
                            </div>
                        </DropdownSection>

                        {/* Appearance */}
                        <DropdownSection
                            icon={<Palette className="w-4 h-4 text-primary" />}
                            title="Appearance"
                            description="Themes and display"
                        >
                            <div className="space-y-6 pt-2">
                                <ThemeSelector />
                                <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase text-primary tracking-tighter">Simple Mode</p>
                                        <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest leading-none">Less decoration, easier to read</p>
                                    </div>
                                    <Switch
                                        checked={minimalist}
                                        onCheckedChange={(checked) => {
                                            setMinimalist(checked);
                                            luxuryClickVibrate();
                                        }}
                                        aria-label="Toggle simple mode"
                                    />
                                </div>
                            </div>
                        </DropdownSection>

                        {/* Companion app */}
                        <DropdownSection
                            icon={<Moon className="w-4 h-4 text-primary" />}
                            title="Noor Connect"
                            description="Prayer times & adhan — our other app"
                        >
                            <div className="pt-2 space-y-3">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Fursan focuses on your streak and community. For prayer times, adhan alerts and more, try our free companion app.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 justify-center gap-3 border-primary/40 bg-card hover:bg-secondary text-primary rounded-2xl transition-all"
                                    onClick={() => window.open(NOOR_CONNECT_URL, '_blank')}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Get Noor Connect on F-Droid</span>
                                </Button>
                            </div>
                        </DropdownSection>
                    </div>

                    <div className="h-[1px] bg-border my-2" />

                    {/* Your data */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-2">Your Data</p>
                        <div className="grid grid-cols-1 gap-2">
                            <Button
                                variant="outline"
                                className="h-12 justify-start gap-4 border-border bg-card hover:bg-secondary text-primary rounded-2xl transition-all"
                                onClick={handleExportKey}
                            >
                                <Download className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Save My Private Key</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 justify-start gap-4 border-destructive/30 bg-card hover:bg-destructive/10 text-destructive rounded-2xl transition-all"
                                onClick={handleWipeData}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Erase All Data</span>
                            </Button>
                        </div>
                    </div>
                    {/* Support */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="h-10 text-[10px] uppercase font-bold tracking-widest border-border bg-card text-foreground hover:bg-secondary rounded-xl transition-all"
                            onClick={() => window.location.href = 'mailto:ubaid0345@proton.me'}
                        >
                            <Mail className="w-3 h-3 mr-2 text-primary" /> Contact
                        </Button>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-10 text-[10px] uppercase font-bold tracking-widest border-border bg-card text-foreground hover:bg-secondary rounded-xl transition-all"
                                >
                                    <Heart className="w-3 h-3 mr-2 text-red-500" /> Donate
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[90%] rounded-2xl bg-background border-2 border-border p-6 shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-black uppercase tracking-tight text-center text-foreground">Support the App</DialogTitle>
                                    <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Help Fursan grow
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    <CryptoField
                                        label="Solana (SOL)"
                                        address="3Aw78BrsdtBeZNpTQvAP6kjtUpGqDBqhr8dATzEZgp8V"
                                        delay={0}
                                    />
                                    <CryptoField
                                        label="Bitcoin (BTC)"
                                        address="bc1q43nelc0skgng752wesq5ez4qzhgl09cksmlddx"
                                        delay={100}
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CryptoField({ label, address, delay }: { label: string, address: string, delay: number }) {
    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        toast.success("Address Copied", { description: `${label} address ready.` });
        luxuryClickVibrate();
    };

    return (
        <div
            className="space-y-1.5 animate-in slide-in-from-bottom-2 fade-in duration-500 fill-mode-backwards"
            style={{ animationDelay: `${delay}ms` }}
        >
            <p className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">{label}</p>
            <div
                onClick={handleCopy}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 cursor-pointer group transition-all active:scale-[0.98]"
            >
                <div className="flex-1 min-w-0 mr-3">
                    <p className="font-mono text-[10px] text-muted-foreground truncate group-hover:text-foreground transition-colors">
                        {address}
                    </p>
                </div>
                <div className="p-1.5 rounded-lg bg-background border border-border group-hover:border-primary/30 transition-colors">
                    <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                </div>
            </div>
        </div>
    );
}

function DropdownSection({ icon, title, description, children }: { icon: React.ReactNode, title: string, description: string, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-border rounded-2xl overflow-hidden bg-card transition-all">
            <button
                onClick={() => { setIsOpen(!isOpen); luxuryClickVibrate(); }}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shadow-inner">
                        {icon}
                    </div>
                    <div className="text-left">
                        <p className="text-[11px] font-black uppercase text-primary tracking-tighter leading-none mb-1">{title}</p>
                        <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest">{description}</p>
                    </div>
                </div>
                <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-all duration-300", isOpen && "rotate-90 text-primary")} />
            </button>
            <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                <div className="p-4 border-t border-border bg-background/60">
                    {children}
                </div>
            </div>
        </div>
    );
}
