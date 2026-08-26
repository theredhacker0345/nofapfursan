import { Button } from "@/components/ui/button";
import { Sun, CloudLightning } from "lucide-react";
import { luxuryClickVibrate } from "@/lib/vibrationUtils";
import { HealthCheck } from "@/services/nostr";

interface MindsetCheckinProps {
    onCheckin: (mindset: HealthCheck['mindset']) => void;
    saving?: boolean;
}

export function MindsetCheckin({ onCheckin, saving }: MindsetCheckinProps) {
    return (
        <div className="royal-card p-6 space-y-5 page-transition">
            <div className="space-y-1">
                <h4 className="text-base font-semibold text-foreground">How are you feeling today?</h4>
                <p className="text-sm text-muted-foreground">A quick daily mind check-in</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
                <button
                    onClick={() => { luxuryClickVibrate(); onCheckin('sharp'); }}
                    disabled={saving}
                    aria-label="Feeling sharp"
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-tertiary-container text-on-tertiary-container hover:brightness-[0.97] transition-all text-xs font-semibold active:scale-[0.98]"
                >
                    <Sun className="w-5 h-5" />
                    Sharp
                </button>
                <button
                    onClick={() => { luxuryClickVibrate(); onCheckin('foggy'); }}
                    disabled={saving}
                    aria-label="Feeling foggy"
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-secondary-container text-on-secondary-container hover:brightness-[0.97] transition-all text-xs font-semibold active:scale-[0.98]"
                >
                    <CloudLightning className="w-5 h-5" />
                    Foggy
                </button>
                <button
                    onClick={() => { luxuryClickVibrate(); onCheckin('stormy'); }}
                    disabled={saving}
                    aria-label="Feeling stormy"
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-error-container text-on-error-container hover:brightness-[0.97] transition-all text-xs font-semibold active:scale-[0.98]"
                >
                    <CloudLightning className="w-5 h-5" />
                    Stormy
                </button>
            </div>
        </div>
    );
}
