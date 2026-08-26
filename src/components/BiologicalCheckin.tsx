import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { luxuryClickVibrate } from "@/lib/vibrationUtils";

interface BiologicalCheckinProps {
    onCheckin: (npt: boolean) => void;
    saving?: boolean;
}

export function BiologicalCheckin({ onCheckin, saving }: BiologicalCheckinProps) {
    return (
        <div className="royal-card p-6 space-y-5 page-transition">
            <div className="space-y-1">
                <h4 className="text-base font-semibold text-foreground">Healthy signs this morning?</h4>
                <p className="text-sm text-muted-foreground">A quick daily body check-in</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Button
                    onClick={() => { luxuryClickVibrate(); onCheckin(true); }}
                    disabled={saving}
                    aria-label="Yes, healthy signs"
                    className="h-14 rounded-2xl bg-tertiary-container text-on-tertiary-container hover:bg-tertiary-container/80 font-semibold text-base transition-colors active:scale-[0.98]"
                >
                    Yes <CheckCircle2 className="ml-2 w-4 h-4" />
                </Button>
                <Button
                    onClick={() => { luxuryClickVibrate(); onCheckin(false); }}
                    disabled={saving}
                    aria-label="No healthy signs"
                    className="h-14 rounded-2xl bg-error-container text-on-error-container hover:bg-error-container/80 font-semibold text-base transition-colors active:scale-[0.98]"
                >
                    No <AlertCircle className="ml-2 w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
