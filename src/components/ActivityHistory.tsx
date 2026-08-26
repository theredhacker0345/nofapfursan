import { useState, useEffect } from 'react';
import { getActivityLog, ActivityEntry, getActivityIcon } from '@/lib/activityLog';
import { formatDistanceToNow } from 'date-fns';
import { History, RefreshCw, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ActivityHistory() {
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const loadActivities = () => {
        setLoading(true);
        const log = getActivityLog();
        setActivities(log);
        setLoading(false);
    };

    useEffect(() => {
        loadActivities();

        // Listen for storage changes (cross-tab sync)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'fursan_activity_log') {
                loadActivities();
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    return (
        <div className="royal-card overflow-hidden page-transition" style={{ animationDelay: "0.4s" }}>
            <div className="p-5 border-b border-amber-200/50 bg-gradient-to-r from-amber-50 to-transparent">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-tight text-amber-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <History className="w-4 h-4 text-white" />
                        </div>
                        Activity Log
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Refresh activity log"
                        onClick={loadActivities}
                        className="h-10 w-10 text-amber-700/70 hover:text-amber-700 hover:bg-amber-100/50"
                    >
                        <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    </Button>
                </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto scrollbar-thin">
                {loading ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="w-8 h-8 mx-auto animate-spin text-amber-300" />
                        <p className="text-[10px] uppercase font-bold tracking-widest text-amber-700/30 mt-4">Syncing History...</p>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <ScrollText className="w-12 h-12 text-amber-200 mb-4" aria-hidden="true" />
                        <p className="text-[11px] uppercase font-bold tracking-widest text-amber-700/70">
                            The Archives are Empty
                        </p>
                        <p className="text-[12px] text-amber-700/60 mt-1 font-medium italic">
                            Your glorious deeds will be recorded here
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-amber-100">
                        {activities.slice(0, 15).map((activity, i) => (
                            <div
                                key={activity.id}
                                className="px-5 py-4 flex items-start gap-4 hover:bg-amber-50/50 transition-colors group"
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                <div className="text-xl h-10 w-10 shrink-0 bg-white border border-amber-100 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0 py-0.5">
                                    <p className="text-sm font-bold leading-tight text-amber-900 group-hover:text-amber-700 transition-colors break-words">
                                        {activity.message}
                                    </p>
                                    <p className="text-[10px] text-amber-600/40 font-mono uppercase mt-1.5 flex items-center gap-1.5">
                                        <div className="w-1 h-1 bg-amber-200 rounded-full" />
                                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 bg-amber-50/30 border-t border-amber-200/50 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-700/40">Latest 15 Updates</p>
            </div>
        </div>
    );
}
