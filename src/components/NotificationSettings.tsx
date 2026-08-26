import { Bell, Clock, Sparkles } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function NotificationSettings() {
    const { enabled, intervalHours, setIntervalHours, isSupported, showTestNotification } = useNotifications();

    if (!isSupported) return null;

    const handleIntervalChange = (value: number[]) => {
        setIntervalHours(value[0]);
        toast.success(`Reminders will now arrive every ${value[0]} hours.`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-surface-2/50 rounded-xl border border-border">
                <Bell className={`w-8 h-8 ${enabled ? 'text-ink-muted' : 'text-ink-muted'} flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-ink truncate">
                        Daily Reminders
                    </h3>
                    <p className="text-[10px] text-ink-muted font-medium break-words leading-tight">
                        {enabled
                            ? "Motivational reminders are active."
                            : "Turn on notifications to get motivational reminders."}
                    </p>
                </div>
            </div>

            <div className="space-y-4 px-1">
                <div className="flex justify-between items-center mb-2">
                    <Label className="flex items-center gap-2 text-[11px] uppercase font-black tracking-widest text-ink">
                        <Clock className="w-4 h-4 text-ink" />
                        How often
                    </Label>
                    <span className="text-ink-muted font-black text-sm">{intervalHours}h</span>
                </div>

                <div className="pt-2">
                    <Slider
                        value={[intervalHours]}
                        onValueChange={handleIntervalChange}
                        min={1}
                        max={24}
                        step={1}
                        disabled={!enabled}
                        className={!enabled ? "opacity-50 cursor-not-allowed" : ""}
                    />
                </div>

                <div className="flex justify-between text-[10px] text-ink-muted font-bold uppercase tracking-tighter">
                    <span>Often (1h)</span>
                    <span>Sometimes (24h)</span>
                </div>

                {!enabled ? (
                    <p className="text-[10px] text-danger font-bold uppercase text-center mt-2 animate-pulse">
                        Turn on reminders first to adjust this
                    </p>
                ) : (
                    <div className="flex justify-center pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-6 rounded-xl border-border text-ink hover:bg-surface-2/50 uppercase text-[10px] font-black tracking-widest shadow-sm group"
                            onClick={showTestNotification}
                        >
                            <Sparkles className="w-3.5 h-3.5 mr-2 text-ink group-hover:animate-spin" />
                            Send Test Reminder
                        </Button>
                    </div>
                )}
            </div>

            <div className="p-4 rounded-xl bg-surface-2/50 border border-border">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-ink mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-ink/70 leading-relaxed font-medium italic">
                        "Verily, in the remembrance of Allah do hearts find rest." (13:28)
                        <br />
                        <span className="not-italic text-[10px] block mt-1 opacity-60">
                            Reminders arrive every {intervalHours} hours to keep you going.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
