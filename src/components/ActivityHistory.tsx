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
        <div className="card overflow-hidden animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="p-5 border-b border-border bg-surface-2/50">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-tight text-ink flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center shadow-lg shadow-sm">
                            <History className="w-4 h-4 text-white" />
                        </div>
                        Activity Log
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Refresh activity log"
                        onClick={loadActivities}
                        className="h-10 w-10 text-ink-muted hover:text-ink/80 hover:bg-surface-2/50"
                    >
                        <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    </Button>
                </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto scrollbar-thin">
                {loading ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="w-8 h-8 mx-auto animate-spin text-ink-muted" />
                        <p className="text-[10px] uppercase font-bold tracking-widest text-ink-muted/70 mt-4">Syncing History...</p>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <ScrollText className="w-12 h-12 text-ink-muted/50 mb-4" aria-hidden="true" />
                        <p className="text-[11px] uppercase font-bold tracking-widest text-ink-muted">
                            The Archives are Empty
                        </p>
                        <p className="text-[12px] text-ink-muted mt-1 font-medium italic">
                            Your glorious deeds will be recorded here
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {activities.slice(0, 15).map((activity, i) => (
                            <div
                                key={activity.id}
                                className="px-5 py-4 flex items-start gap-4 hover:bg-surface-2/50 transition-colors group"
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                <div className="text-xl h-10 w-10 shrink-0 bg-white border border-border rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0 py-0.5">
                                    <p className="text-sm font-bold leading-tight text-ink group-hover:text-ink/80 transition-colors break-words">
                                        {activity.message}
                                    </p>
                                    <p className="text-[10px] text-ink-muted font-mono uppercase mt-1.5 flex items-center gap-1.5">
                                        <div className="w-1 h-1 bg-border rounded-full" />
                                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 bg-surface-2/40 border-t border-border text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-ink-muted">Latest 15 Updates</p>
            </div>
        </div>
    );
}
