import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { DailyHealthCheck } from "@/components/DailyHealthCheck";
import { LoadingScreen } from "@/components/LoadingScreen";
import { fetchHealthChecks, HealthCheck } from "@/services/nostr";
import { useStreak } from "@/hooks/useStreak";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Shield, Lock, Activity, Zap, Info, ShieldCheck, Flame } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from "@/components/ui/dialog";

export default function Vitals() {
    const { streakData } = useStreak();
    const [healthHistory, setHealthHistory] = useState<HealthCheck[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const checks = await fetchHealthChecks();
            setHealthHistory(checks || []);
        } catch (e) {
            console.error("Failed to fetch health checks", e);
        }
        if (!silent) setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRefresh = () => {
        loadData(true);
    };

    const currentLiveDays = useMemo(() => {
        if (!streakData.startDate) return 0;
        return Math.floor((new Date().getTime() - new Date(streakData.startDate).getTime()) / (1000 * 60 * 60 * 24));
    }, [streakData.startDate]);

    // Prepare Recovery Trend Chart Data
    const trendData = useMemo(() => {
        const data = [];
        const today = new Date();

        for (let i = 14; i >= 0; i--) {
            const date = subDays(today, i);
            const dateStr = format(date, "MMM d");
            const check = healthHistory.find(h => isSameDay(new Date(h.timestamp), date));

            let mindsetValue = 4; // small stub so empty days are still visible
            let color = "#ecd9ae"; // Warm gold-tint (visible on cream card) for missing days

            if (check) {
                switch (check.mindset) {
                    case 'sharp': mindsetValue = 100; color = "#10b981"; break;
                    case 'foggy': mindsetValue = 60; color = "#fbbf24"; break;
                    case 'stormy': mindsetValue = 30; color = "#ef4444"; break;
                    default: mindsetValue = 10; color = "#94a3b8";
                }
            }

            data.push({
                date: dateStr,
                value: mindsetValue,
                color: color,
                npt: check?.npt ? "YES" : (check ? "NO" : "NA"),
                mindset: check?.mindset?.toUpperCase() || "OFFLINE"
            });
        }
        return data;
    }, [healthHistory]);

    if (loading) {
        return <LoadingScreen message="Loading..." subMessage="Updating your progress" />;
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <div className="container max-w-lg mx-auto px-4">
                <Header />

                <header className="mb-8 mt-4 page-transition" style={{ animationDelay: "0.1s" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-900 to-black flex items-center justify-center shadow-lg">
                            <Lock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-amber-900 tracking-tighter uppercase">Health Tracker</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600/50">Your daily progress</p>
                        </div>
                    </div>
                </header>

                <div className="mb-8 page-transition" style={{ animationDelay: "0.15s" }}>
                    <DailyHealthCheck onUpdate={handleRefresh} days={currentLiveDays} />
                </div>

                <div className="grid gap-8">
                    {/* Recovery Trend Chart */}
                    <div className="royal-card overflow-hidden page-transition" style={{ animationDelay: "0.2s" }}>
                        <div className="p-5 border-b border-amber-200/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-800 to-amber-950 flex items-center justify-center shadow-md">
                                    <Activity className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-tight text-amber-800">Progress Report</h3>
                                    <p className="text-[10px] font-bold text-amber-600/50 uppercase tracking-widest">Mind & Body results</p>
                                </div>
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button aria-label="About the progress chart" className="p-2.5 hover:bg-amber-100/50 rounded-full transition-colors">
                                        <Info className="w-4 h-4 text-amber-500" />
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="rounded-2xl border-amber-200 bg-white">
                                    <DialogHeader>
                                        <DialogTitle className="text-amber-900 text-2xl font-black uppercase tracking-tighter">Protocol Trend</DialogTitle>
                                        <DialogDescription className="text-amber-800/70 font-medium text-sm pt-4">
                                            This chart shows your daily mindset (Green: Good, Amber: Okay, Red: Struggling) along with your physical results. Try to stay in the Green!
                                        </DialogDescription>
                                    </DialogHeader>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="p-6">
                            <div className="h-[240px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData} margin={{ left: -20, right: 10, top: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d97706" strokeOpacity={0.05} />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fontWeight: 900, fill: '#92400e' }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(217, 119, 6, 0.05)' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white border-2 border-amber-100 p-3 rounded-2xl shadow-2xl">
                                                            <p className="text-[9px] font-black uppercase text-amber-300 mb-2">{data.date}</p>
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black text-amber-900 uppercase flex items-center gap-1.5">
                                                                    <Zap className="w-3 h-3 text-amber-500" />
                                                                    Mindset: {data.mindset}
                                                                </p>
                                                                <p className="text-[10px] font-black text-amber-900 uppercase flex items-center gap-1.5">
                                                                    <Activity className="w-3 h-3 text-rose-500" />
                                                                    Biological: {data.npt}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                                            {trendData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-100">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-900">Your Status</p>
                                        <p className="text-[9px] font-bold text-amber-600/60 uppercase">
                                            {healthHistory.some(h => h.mindset === 'stormy') ? "Keep working at it" : "Looking Good"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" title="Sharp" />
                                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm" title="Foggy" />
                                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm" title="Stormy" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fortress Stats Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="royal-card p-5 text-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                                <Zap className="w-5 h-5 text-emerald-600" />
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-800/40">Good mindset %</p>
                            <p className="text-2xl font-black text-black">
                                {healthHistory.length > 0 ? Math.round((healthHistory.filter(h => h.mindset === 'sharp').length / healthHistory.length) * 100) : 0}%
                            </p>
                        </div>
                        <div className="royal-card p-5 text-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-2">
                                <Flame className="w-5 h-5 text-rose-600" />
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-800/40">Physical health %</p>
                            <p className="text-2xl font-black text-black">
                                {healthHistory.length > 0 ? Math.round((healthHistory.filter(h => h.npt).length / healthHistory.length) * 100) : 0}%
                            </p>
                        </div>
                    </div>
                </div>

                <footer className="mt-16 mb-8 text-center text-amber-800/10">
                    <p className="font-bold uppercase tracking-[0.5em] text-[8px]">Stay strong and keep going. ⚔️</p>
                </footer>
            </div>
            <BottomNav />
        </div>
    );
}

