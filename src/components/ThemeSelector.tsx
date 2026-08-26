import { THEMES } from "@/data/themes";
import { useTheme } from "@/context/ThemeContext";
import { Lock, Check, Sparkles, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

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
        toast.success("Aesthetics Updated", {
            description: `Activated ${THEMES.find(t => t.id === themeId)?.name}.`
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground">Themes</h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary px-3 py-1 rounded-full border border-border">
                    {unlockedThemes.length}/{THEMES.length} Unlocked
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
                {THEMES.map((theme) => {
                    const isUnlocked = unlockedThemes.includes(theme.id);
                    const isSelected = currentTheme.id === theme.id;

                    return (
                        <div
                            key={theme.id}
                            onClick={() => handleSetTheme(theme.id, isUnlocked)}
                            className={`
                                relative p-5 rounded-2xl border-2 transition-all duration-500 text-left group overflow-hidden
                                ${isSelected
                                    ? 'border-primary bg-secondary/50 shadow-lg shadow-primary/20'
                                    : 'border-border bg-card hover:border-primary/50 hover:shadow-md'}
                                ${!isUnlocked ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer'}
                            `}
                        >
                            {/* Theme color hint in background */}
                            <div
                                className="absolute -top-4 -right-4 w-12 h-12 rounded-full blur-2xl opacity-20 transition-all group-hover:opacity-40"
                                style={{ backgroundColor: theme.preview }}
                            />

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div
                                    className="w-6 h-6 rounded-full border-2 border-background shadow-md ring-1 ring-border"
                                    style={{ backgroundColor: theme.preview }}
                                />
                                {!isUnlocked ? (
                                    <div className="bg-secondary text-muted-foreground p-1.5 rounded-lg">
                                        <Lock className="w-3.5 h-3.5" />
                                    </div>
                                ) : isSelected ? (
                                    <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-lg shadow-primary/20">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                ) : null}
                            </div>

                            <div className="relative z-10">
                                <p className="text-[11px] font-black uppercase tracking-widest text-foreground">{theme.name}</p>
                                <p className="text-[9px] uppercase font-bold text-muted-foreground/60 leading-tight mt-1 mb-5">
                                    {isUnlocked ? theme.description : `Unlocks at DAY ${theme.minDays}`}
                                </p>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-9 px-3 text-[9px] border border-border rounded-xl uppercase font-black tracking-widest hover:bg-secondary transition-all"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            previewTheme(theme.id);
                                            toast.info("Aesthetic Preview", {
                                                description: `Witnessing ${theme.name} for 3 seconds.`,
                                                duration: 3000
                                            });
                                        }}
                                    >
                                        <Eye className="w-3 h-3 mr-1.5 text-primary" />
                                        Preview
                                    </Button>
                                    {isUnlocked && !isSelected && (
                                        <Button
                                            size="sm"
                                            className="h-9 px-4 text-[9px] bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl uppercase font-black tracking-widest transition-all shadow-md active:scale-95"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSetTheme(theme.id, true);
                                            }}
                                        >
                                            Activate
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {isSelected && (
                                <div className="absolute top-0 right-0 p-2">
                                    <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
