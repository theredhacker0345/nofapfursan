import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, AlertTriangle, Download, Upload } from "lucide-react";
import { exportKeys, importKey } from "@/services/nostr";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { useNostrStreak } from "@/hooks/useNostrStreak";
import { getStreakData, saveStreakData } from "@/lib/streakUtils";

export function SecuritySettings() {
    const [keys, setKeys] = useState<{ nsec: string; npub: string } | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [importNsec, setImportNsec] = useState("");
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [loading, setLoading] = useState(false);

    const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
    const { fetchStreak, initializeKeys } = useNostrStreak();

    useEffect(() => {
        loadKeys();
    }, []);

    const loadKeys = async () => {
        const k = await exportKeys();
        setKeys(k);
    };

    // Hold to reveal logic
    const startHold = () => {
        if (isRevealed) {
            setIsRevealed(false);
            return;
        }

        setHoldProgress(0);
        const startTime = Date.now();
        const DURATION = 1000; // 1 second hold

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / DURATION) * 100, 100);
            setHoldProgress(progress);

            if (elapsed >= DURATION) {
                setIsRevealed(true);
                setHoldProgress(0);
                clearInterval(interval);
            }
        }, 50);

        holdTimerRef.current = interval;
    };

    const cancelHold = () => {
        if (holdTimerRef.current) {
            clearInterval(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        setHoldProgress(0);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleImport = async () => {
        if (!importNsec.startsWith("nsec")) {
            toast.error("Invalid key format. Must start with 'nsec'.");
            return;
        }

        setLoading(true);
        try {
            await importKey(importNsec);
            await initializeKeys(); // Reload hook state
            setImportDialogOpen(false);
            setImportNsec("");
            toast.success("Identity imported successfully!");

            // Auto-fetch streak
            toast.info("Restoring your streak from relays...");
            const streak = await fetchStreak();

            if (streak) {
                // Save to local storage
                const localFormat = {
                    startDate: streak.startDate,
                    longestStreak: streak.longestStreak,
                    totalRelapses: streak.totalRelapses,
                };
                saveStreakData(localFormat);
                toast.success("Streak restored!");
                // Force refresh somehow? Window reload is nuclear but effective for this critical change
                setTimeout(() => window.location.reload(), 1500);
            } else {
                toast.warning("No backup found for this key.");
            }

            loadKeys(); // Refresh displayed keys
        } catch (error) {
            toast.error("Failed to import key. Please check it and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!keys) return;
        const element = document.createElement("a");
        const file = new Blob([`Nostr Private Key (nsec): ${keys.nsec}\nKeep this file secure and offline!`], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "fursan_backup_nsec.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        toast.success("Backup file downloaded.");
    };

    return (
        <div className="space-y-6 pt-8 border-t border-black/10">
            <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-widest">Backup & Security</h2>
            </div>

            <div className="space-y-6">
                {/* Export Section */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-ink-muted">Private Access Key (nsec)</Label>
                        <div className="relative">
                            <div className="h-12 w-full border border-black bg-white px-3 py-2 flex items-center overflow-hidden">
                                <span className="truncate font-mono text-xs w-full">
                                    {isRevealed && keys ? keys.nsec : "•••••••••••••••••••••••••••••••••••••"}
                                </span>
                            </div>

                            {/* Hold Progress Bar */}
                            {holdProgress > 0 && (
                                <div className="absolute inset-0 bg-black/5 pointer-events-none">
                                    <div
                                        className="h-full bg-black/10 transition-all duration-75 ease-linear"
                                        style={{ width: `${holdProgress}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            className={`flex-1 border-black rounded-none h-11 text-xs uppercase font-bold select-none touch-none ${isRevealed ? "bg-black text-white hover:bg-black/90" : "bg-white text-black"}`}
                            onMouseDown={startHold}
                            onMouseUp={cancelHold}
                            onMouseLeave={cancelHold}
                            onTouchStart={startHold}
                            onTouchEnd={cancelHold}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            {isRevealed ? "Hide" : "Hold to Reveal"}
                        </Button>

                        <div className="flex gap-2 flex-1">
                            <Button
                                variant="outline"
                                className="flex-1 border-black rounded-none h-11 text-xs uppercase font-bold bg-white text-black hover:bg-gray-50"
                                onClick={() => keys && copyToClipboard(keys.nsec, "Private Key")}
                                disabled={!isRevealed}
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                            </Button>

                            <Button
                                variant="outline"
                                className="flex-1 border-black rounded-none h-11 text-xs uppercase font-bold bg-white text-black hover:bg-gray-50"
                                onClick={handleDownload}
                                disabled={!isRevealed}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                File
                            </Button>
                        </div>
                    </div>

                    <div className="p-3 border border-black bg-gray-50 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-black shrink-0 mt-0.5" />
                        <p className="text-[10px] leading-tight font-medium uppercase break-words">
                            Never share your nsec! If you lose this key, you lose your identity and your streak.
                        </p>
                    </div>
                </div>

                {/* Import Section */}
                <div className="pt-6">
                    <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full border-black rounded-none h-12 text-xs uppercase font-bold bg-white text-black hover:bg-gray-50">
                                <Upload className="mr-2 h-4 w-4" />
                                Import Existing Identity
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="border-black rounded-none shadow-none max-w-[90vw] md:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="uppercase tracking-widest text-lg font-bold">Restore Identity</DialogTitle>
                                <DialogDescription className="text-xs uppercase leading-relaxed text-ink-muted">
                                    Paste your nsec key below. This will replace the current identity on this device.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nsec" className="text-[10px] uppercase">nsec Private Key</Label>
                                    <Input
                                        id="nsec"
                                        placeholder="nsec1..."
                                        value={importNsec}
                                        onChange={(e) => setImportNsec(e.target.value)}
                                        className="font-mono text-xs border-black rounded-none h-12 bg-white"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setImportDialogOpen(false)}
                                    className="border-black rounded-none h-12 uppercase text-xs font-bold sm:flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleImport}
                                    disabled={!importNsec || loading}
                                    className="bg-black text-white hover:bg-black/90 border-none rounded-none h-12 uppercase text-xs font-bold sm:flex-1"
                                >
                                    {loading ? "Importing..." : "Restore & Sync"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
