import { THEMES } from "@/data/themes";
import { useTheme } from "@/context/ThemeContext";
import { Lock, Check, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ThemeSelector() {
    const { currentTheme, setTheme, previewTheme, unlockedThemes } = useTheme();

    const handleSetTheme = (themeId: string, isUnlocked: boolean) => {
        if (!isUnlocked) {
            toast.error("Theme Locked", {
                description: "Build a longer streak to unlock this theme."
            });
            return;
        }
        setTheme(themeId);
        toast.success("Theme Updated", {
            description: `Switched to ${THEMES.find(t => t.id === themeId)?.name}.`
        });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
                {THEMES.map((theme) => {
                    const isUnlocked = unlockedThemes.includes(theme.id);
                    const isSelected = currentTheme.id === theme.id;

                    return (
                        <button
                            key={theme.id}
                            onClick={() => handleSetTheme(theme.id, isUnlocked)}
                            disabled={!isUnlocked}
                            aria-pressed={isSelected}
                            aria-label={`${isSelected ? 'Current theme' : 'Switch to'} ${theme.name}${!isUnlocked ? ` (unlocks at day ${theme.minDays})` : ''}`}
                            className={cn(
                                "relative w-full text-left p-4 rounded-xl border transition-colors flex items-center gap-4",
                                isSelected
                                    ? 'border-ink bg-surface-2/50'
                                    : 'border-border bg-bg hover:bg-surface-2/40',
                                !isUnlocked && 'opacity-60 cursor-not-allowed'
                            )}
                        >
                            <div
                                className="w-9 h-9 rounded-lg border border-border flex-shrink-0"
                                style={{ backgroundColor: theme.preview }}
                                aria-hidden="true"
                            />

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-ink flex items-center gap-2">
                                    {theme.name}
                                    {isSelected && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink">
                                            <Check className="w-3 h-3" /> Active
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-ink-muted mt-0.5 truncate">
                                    {isUnlocked ? theme.description : `Unlocks at day ${theme.minDays}`}
                                </p>
                            </div>

                            {!isUnlocked ? (
                                <Lock className="w-4 h-4 text-ink-muted flex-shrink-0" />
                            ) : !isSelected && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 px-3 text-xs font-medium rounded-lg border-border"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        previewTheme(theme.id);
                                        toast.info("Previewing theme", {
                                            description: `${theme.name} for 3 seconds.`,
                                            duration: 3000
                                        });
                                    }}
                                >
                                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                                    Preview
                                </Button>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
