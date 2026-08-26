import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// DYNAMIC FIRE ICON
// ============================================================================

interface DynamicFireProps {
    streakDays: number;
    className?: string;
}

export function DynamicFire({ streakDays, className }: DynamicFireProps) {
    // Determine color and glow based on streak
    const getFireStyle = () => {
        if (streakDays === 0) {
            return {
                color: "text-gray-400",
                glow: "",
                scale: 1,
            };
        }

        if (streakDays < 30) {
            return {
                color: "text-orange-500",
                glow: "drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]",
                scale: 1.1,
            };
        }

        // 30+ days: God Mode (Purple/Gold)
        return {
            color: "text-purple-400",
            glow: "drop-shadow-[0_0_15px_rgba(168,85,247,0.6)] filter-[brightness(1.2)]",
            scale: 1.2,
        };
    };

    const style = getFireStyle();

    return (
        <motion.div
            initial={{ scale: 1 }}
            animate={{
                scale: [style.scale, style.scale * 1.1, style.scale],
                rotate: streakDays >= 30 ? [0, 5, -5, 0] : 0
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            className={cn("relative", className)}
        >
            <Flame
                className={cn(
                    "w-full h-full transition-all duration-500",
                    style.color,
                    style.glow
                )}
                fill={streakDays > 0 ? "currentColor" : "none"}
            />

            {/* Golden core for 30+ days */}
            {streakDays >= 30 && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center opacity-50"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <Flame className="w-2/3 h-2/3 text-yellow-300 drop-shadow-md" fill="currentColor" />
                </motion.div>
            )}
        </motion.div>
    );
}

// ============================================================================
// ACTIVITY HEATMAP
// ============================================================================

interface ActivityHeatmapProps {
    startDate: string | null;
}

export function ActivityHeatmap({ startDate }: ActivityHeatmapProps) {
    // Generate valid dates
    const generateDates = () => {
        const dates = [];
        // Generate for last 12 weeks (approx 84 days) for a GitHub-like grid
        const weeks = 12;
        const days = weeks * 7;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            let level = 0; // 0: empty, 1: active (low), 2: active (high)

            // Logic: If we have a start date and this date is AFTER start date, it's green
            if (start && date >= start) {
                // Make recent days "hotter"
                const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                level = diff < 7 ? 2 : 1;
            }

            dates.push({ date, level });
        }
        return dates;
    };

    const grid = generateDates();

    return (
        <div className="w-full p-4 bg-card rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    Activity History
                </h3>
            </div>

            {/* Heatmap Grid - 7 rows (days), X columns (weeks) */}
            {/* We use CSS grid with auto-flow-col to stack by column (weeks) like GitHub */}
            <div className="grid grid-rows-7 grid-flow-col gap-1 w-full overflow-x-auto pb-2">
                {grid.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.005 }}
                        className={cn(
                            "w-3 h-3 rounded-[2px]",
                            item.level === 0 && "bg-secondary/40",
                            item.level === 1 && "bg-secondary/40 border border-border",
                            item.level === 2 && "bg-secondary shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                        )}
                        title={item.date.toLocaleDateString()}
                    />
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground mt-2">
                <span>Less</span>
                <div className="w-2 h-2 rounded-[2px] bg-secondary/40" />
                <div className="w-2 h-2 rounded-[2px] bg-secondary/40" />
                <div className="w-2 h-2 rounded-[2px] bg-secondary" />
                <span>More</span>
            </div>
        </div>
    );
}
