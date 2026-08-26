import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { saveHealthCheck, fetchHealthChecks, HealthCheck } from "@/services/nostr";
import { Shield, Activity, AlertCircle, CheckCircle2, Zap, CloudLightning, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { MindsetCheckin } from "./MindsetCheckin";
import { BiologicalCheckin } from "./BiologicalCheckin";

interface DailyHealthCheckProps {
    onUpdate?: () => void;
    days?: number;
    showPillar?: 'mindset' | 'biological' | 'all';
}

export function DailyHealthCheck({ onUpdate, days = 0, showPillar = 'all' }: DailyHealthCheckProps) {
    const [history, setHistory] = useState<HealthCheck[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showMedicalAlert, setShowMedicalAlert] = useState(false);
    const [hasSubmitedToday, setHasSubmitedToday] = useState(false);
    const [tempNpt, setTempNpt] = useState<boolean | null>(null);
    const [isEmergencyLocked, setIsEmergencyLocked] = useState(false);
    const [isCompletionConfirmed, setIsCompletionConfirmed] = useState(false);
    const [unlockTimer, setUnlockTimer] = useState(5);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | undefined;
        if (isEmergencyLocked && unlockTimer > 0) {
            timer = setInterval(() => {
                setUnlockTimer(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isEmergencyLocked, unlockTimer]);

    useEffect(() => {
        loadHealthData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [days]);

    const loadHealthData = async () => {
        try {
            setLoading(true);
            const data = await fetchHealthChecks();
            setHistory(data);

            const latest = data[0];
            if (latest && latest.mindset === 'stormy' && !localStorage.getItem('fursan_stormy_resolved')) {
                setIsEmergencyLocked(true);
            }

            // Check if already submitted today
            const today = new Date().toDateString();
            const submittedToday = data.some(entry => new Date(entry.timestamp).toDateString() === today);
            setHasSubmitedToday(submittedToday);

            // Check for medical alert (14 consecutive recent days of 'No')
            if (days >= 4) {
                const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
                const last14 = data.filter(e => e.timestamp >= fourteenDaysAgo).slice(0, 14);
                const allNo = last14.length >= 14 && last14.every(entry => !entry.npt);
                if (allNo) {
                    setShowMedicalAlert(true);
                }
            }
        } catch (e) {
            console.error("Failed to load health data", e);
        } finally {
            setLoading(false);
        }
    };

    const handleMindsetSelection = async (mindset: HealthCheck['mindset']) => {
        // Special case: if we are only showing mindset, we need a default for NPT or wait for it
        // Actually, the protocol usually flows NPT -> Mindset.
        // If we move NPT below mindset, we might need to adjust logic.
        // The user wants: Streak -> Mindset Checkin -> NPT Checkin -> Prayer.

        // Let's allow individual submits if we are in modular mode
        if (showPillar === 'mindset') {
            await finalizeProtocol(null, mindset);
        } else {
            // Need NPT first usually in step 1
            // This path is for the 'all' case, where tempNpt would have been set by BiologicalCheckin
            if (tempNpt === null) return; // Should not happen if flow is correct
            await finalizeProtocol(tempNpt, mindset);
        }
    };

    const handleNptSelection = async (npt: boolean) => {
        if (showPillar === 'biological') {
            await finalizeProtocol(npt, null);
        } else {
            setTempNpt(npt);
            // Step logic handled inside the old monolithic view
            // For 'all' case, this sets tempNpt, then MindsetCheckin will be rendered
        }
    };

    const finalizeProtocol = async (npt: boolean | null, mindset: HealthCheck['mindset'] | null) => {
        setSaving(true);

        // Merge with today's existing entry (if any) instead of creating a
        // duplicate half-filled record that would skew the stats.
        const today = new Date().toDateString();
        const existingToday = history.find(e => new Date(e.timestamp).toDateString() === today);
        const entry: HealthCheck = {
            npt: npt ?? existingToday?.npt ?? true,
            mindset: mindset ?? existingToday?.mindset ?? 'sharp',
            timestamp: Date.now(),
        };

        const success = await saveHealthCheck(entry);
        if (success) {
            await luxuryClickVibrate();
            toast.success("Progress saved. 🛡️");
            logActivity('health_check', `Daily Check: Signal: ${entry.npt}, Mindset: ${entry.mindset}`);
            setHasSubmitedToday(true);
            setHistory([entry, ...history.filter(h => h.id !== existingToday?.id)]);
            if (entry.mindset === 'stormy') {
                localStorage.removeItem('fursan_stormy_resolved');
                setIsEmergencyLocked(true);
                setUnlockTimer(5);
                setIsCompletionConfirmed(false);
            }
            if (onUpdate) onUpdate();

            // Foggy Penalty Check (only if mindset was actually checked)
            if (mindset === 'foggy') {
                const last3 = [entry, ...history].slice(0, 3);
                if (last3.length === 3 && last3.every(e => e.mindset === 'foggy')) {
                    toast.warning("Mental Pollution detected. Tighten your discipline.");
                }
            }
        } else {
            toast.error("Failed to broadcast protocol results.");
        }
        setSaving(false);
    };

    const resolveEmergency = async () => {
        if (!isCompletionConfirmed) return;
        setIsEmergencyLocked(false);
        localStorage.setItem('fursan_stormy_resolved', 'true');
        toast.success("Done! Stay strong.");
        await luxuryClickVibrate();
    };

    const getHealthStatus = () => {
        if (history.length === 0) return null;

        const last7 = history.slice(0, 7);
        const yesCount = last7.filter(e => e.npt).length;

        // Initial phase logic
        if (days < 4) {
            return {
                status: "STABILIZING",
                color: "text-blue-600",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
                insight: "Everything is getting ready. Stay focused.",
                icon: <Zap className="w-4 h-4" />
            };
        }

        if (yesCount >= 4) return {
            status: "OPTIMAL",
            color: "text-emerald-600",
            bgColor: "bg-emerald-50",
            borderColor: "border-emerald-200",
            insight: "Hormones and Blood Flow are in great shape.",
            icon: <Shield className="w-4 h-4" />
        };

        if (yesCount >= 1) return {
            status: "WARNING",
            color: "text-amber-600",
            bgColor: "bg-amber-50",
            borderColor: "border-amber-200",
            insight: "Markers below baseline. Refine sleep and discipline.",
            icon: <AlertCircle className="w-4 h-4" />
        };

        return {
            status: "CRITICAL",
            color: "text-red-600",
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
            insight: "Critical markers detected. Time to tighten your routine.",
            icon: <Activity className="w-4 h-4 sub-label" />
        };
    };

    const statusInfo = getHealthStatus();

    if (loading) return null;

    if (isEmergencyLocked) {
        const overlay = (
            <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 transition-all duration-500">
                <div className="royal-card bg-black w-full max-w-md p-8 text-center space-y-6 border-2 border-red-900/50 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                    <CloudLightning className="w-20 h-20 mx-auto text-red-600 animate-pulse" />
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Stay Strong!</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/60">Take a break and refocus</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-red-950/30 border border-red-900/40 space-y-3">
                        <p className="text-sm font-bold text-red-100 leading-relaxed uppercase tracking-widest">
                            Urgent moment detected.<br />Do 50 pushups or take a cold shower now.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 justify-center p-3 bg-red-900/10 rounded-xl border border-red-900/20">
                        <input
                            type="checkbox"
                            id="confirm-emergency"
                            checked={isCompletionConfirmed}
                            onChange={(e) => {
                                luxuryClickVibrate();
                                setIsCompletionConfirmed(e.target.checked);
                            }}
                            className="w-5 h-5 rounded border-red-900 text-red-600 focus:ring-red-600 bg-black"
                        />
                        <label htmlFor="confirm-emergency" className="text-[10px] font-black uppercase text-red-100/60 cursor-pointer select-none">I have finished this task</label>
                    </div>
                    <Button
                        disabled={!isCompletionConfirmed || unlockTimer > 0}
                        onClick={resolveEmergency}
                        className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl disabled:opacity-20 transition-all active:scale-95"
                    >
                        {unlockTimer > 0 ? `Wait (${unlockTimer}s)` : "Back to app"}
                    </Button>
                </div>
            </div>
        );

        return createPortal(overlay, document.body);
    }

    if (hasSubmitedToday && showPillar !== 'all') return null;

    if (showPillar === 'mindset') {
        return <MindsetCheckin onCheckin={handleMindsetSelection} saving={saving} />;
    }

    if (showPillar === 'biological') {
        return <BiologicalCheckin onCheckin={handleNptSelection} saving={saving} />;
    }

    return (
        <div className="space-y-4 page-transition" style={{ animationDelay: "0.05s" }}>
            <div className="royal-card overflow-hidden">
                <div className="p-5 border-b border-amber-200/50">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-800/20 to-amber-900/10 flex items-center justify-center border border-amber-100">
                                <Shield className="w-5 h-5 text-amber-900" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-tight text-amber-800">Daily Check</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/50 sub-label">Mind & Body Check</p>
                            </div>
                        </div>
                        {statusInfo && (
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.borderColor} border text-[9px] font-bold ${statusInfo.color}`}>
                                {statusInfo.icon}
                                {statusInfo.status}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {!hasSubmitedToday ? (
                        <AnimatePresence mode="wait">
                            {tempNpt === null ? (
                                <motion.div
                                    key="biological-checkin"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <BiologicalCheckin onCheckin={handleNptSelection} saving={saving} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="mindset-checkin"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <MindsetCheckin onCheckin={handleMindsetSelection} saving={saving} />
                                    <button
                                        onClick={() => setTempNpt(null)}
                                        className="w-full text-[9px] font-black uppercase tracking-[0.2em] text-amber-600/30 hover:text-amber-600/60"
                                    >
                                        Go Back
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    ) : (
                        <div className="py-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto shadow-inner">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-700">All Done!</p>
                                <p className="text-[10px] font-bold text-emerald-600/60 uppercase">You've finished your checks for today. See you tomorrow!</p>
                            </div>
                            {statusInfo && statusInfo.insight && (
                                <div className={cn("text-[10px] font-black uppercase tracking-widest p-3 rounded-xl border opacity-80 sub-label", statusInfo.bgColor, statusInfo.borderColor, statusInfo.color)}>
                                    ⚡ {statusInfo.insight}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={showMedicalAlert} onOpenChange={setShowMedicalAlert}>
                <DialogContent className="rounded-2xl border-amber-200 bg-white max-w-md shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 font-black uppercase text-xl">
                            <Activity className="w-6 h-6" /> Health Insight
                        </DialogTitle>
                        <DialogDescription className="text-gray-700 font-medium text-sm pt-4">
                            🛡️ We've noticed a lack of NPT for 2 weeks. This is a primary indicator of vascular health.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 my-4">
                        <p className="text-sm text-red-900 font-bold italic">
                            "We recommend a routine check-up with a urologist to ensure your cardiovascular system is 100%."
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            className="w-full rounded-xl bg-amber-900 text-white font-black uppercase tracking-widest h-12 shadow-lg hover:bg-black"
                            onClick={() => setShowMedicalAlert(false)}
                        >
                            ACKNOWLEDGED
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
