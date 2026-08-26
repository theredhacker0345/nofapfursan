import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { StatsCard } from "@/components/StatsCard";
import { MotivationCard } from "@/components/MotivationCard";
import { ActivityHistory } from "@/components/ActivityHistory";
import { ActivityHeatmap } from "@/components/DynamicComponents";
import { useStreak } from "@/hooks/useStreak";
import { Library, ScrollText, BarChart3, History } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function Archives() {
    const { streakData } = useStreak();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading for smoother experience
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <LoadingScreen message="Loading..." subMessage="Getting your history..." />;
    }

    return (
        <div className="min-h-screen bg-bg pb-24">
            <div className="container max-w-lg mx-auto px-4">
                <Header />

                <header className="mb-8 mt-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-ink flex items-center justify-center shadow-lg shadow-primary/20">
                            <Library className="w-6 h-6 text-bg" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-display text-ink tracking-tight">My History</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ink-muted">View your progress</p>
                        </div>
                    </div>
                </header>

                <div className="space-y-8 flex flex-col items-center">
                    <div className="w-full animate-fade-in" style={{ animationDelay: "0.15s" }}>
                        <div className="flex items-center gap-2 text-ink font-bold text-sm uppercase tracking-widest px-1 mb-4">
                            <BarChart3 className="w-4 h-4 text-ink" />
                            Detailed Stats
                        </div>
                        <StatsCard data={streakData} />
                    </div>

                    <div className="w-full animate-fade-in" style={{ animationDelay: "0.2s" }}>
                        <div className="flex items-center gap-2 text-ink font-bold text-sm uppercase tracking-widest px-1 mb-4">
                            <ScrollText className="w-4 h-4 text-ink" />
                            Daily Wisdom
                        </div>
                        <MotivationCard />
                    </div>

                    <div className="w-full animate-fade-in" style={{ animationDelay: "0.25s" }}>
                        <div className="flex items-center gap-2 text-ink font-bold text-sm uppercase tracking-widest px-1 mb-4">
                            <History className="w-4 h-4 text-ink" />
                            Timeline
                        </div>
                        <ActivityHistory />
                    </div>

                    <div className="w-full animate-fade-in" style={{ animationDelay: "0.3s" }}>
                        <div className="flex items-center gap-2 text-ink font-bold text-sm uppercase tracking-widest px-1 mb-4">
                            <Library className="w-4 h-4 text-ink" />
                            Activity Heatmap
                        </div>
                        <ActivityHeatmap startDate={streakData?.startDate} />
                    </div>
                </div>

                <footer className="mt-16 mb-8 text-center text-ink-muted/30">
                    <p className="font-bold uppercase tracking-[0.5em] text-[10px]">Stay strong and keep going. ⚔️</p>
                </footer>
            </div>
            <BottomNav />
        </div>
    );
}
