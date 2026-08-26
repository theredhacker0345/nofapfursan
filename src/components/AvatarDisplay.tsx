import { Crown, TrendingUp } from "lucide-react";
import { getAvatarLevel, getNextAvatarLevel, getDaysUntilNextLevel, MILESTONES } from "@/lib/streakUtils";
import { Progress } from "@/components/ui/progress";

interface AvatarDisplayProps {
  days: number;
}

export function AvatarDisplay({ days }: AvatarDisplayProps) {
  const currentLevel = getAvatarLevel(days);
  const nextLevel = getNextAvatarLevel(days);
  const daysUntilNext = getDaysUntilNextLevel(days);

  const progressToNext = nextLevel
    ? ((days - currentLevel.minDays) / (nextLevel.minDays - currentLevel.minDays)) * 100
    : 100;

  return (
    <div className="card p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center gap-2 mb-4">
        <Crown className="w-5 h-5 text-ink" />
        <span className="text-ink/60 font-medium uppercase tracking-widest text-xs">Current Standing</span>
      </div>

      <div className="flex flex-col items-center mb-6 text-center">
        <div className="relative">
          <span className="text-7xl sm:text-8xl  block">{currentLevel.emoji}</span>
          {days >= 90 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-ink rounded-full flex items-center justify-center animate-pulse-glow shadow-lg border-2 border-white">
              <span className="text-[10px]">🔥</span>
            </div>
          )}
        </div>
        <h3 className={`text-2xl sm:text-3xl font-display mt-4 ${currentLevel.color} break-words px-2`}>
          {currentLevel.name}
        </h3>
        <p className="text-ink-muted text-sm mt-1 px-4 leading-relaxed">{currentLevel.description}</p>
      </div>

      {nextLevel && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Next: {nextLevel.emoji} {nextLevel.name}</span>
            <span className="text-ink font-semibold">{daysUntilNext} days</span>
          </div>
          <Progress value={progressToNext} className="h-2" />
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-ink-muted" />
          <span className="text-sm text-ink-muted">Path of Honor</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {MILESTONES.slice(1).map((level) => (
            <div
              key={level.name}
              title={level.description}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-help ${days >= level.minDays
                ? "bg-ink/20 text-ink"
                : "bg-surface-2 text-ink-muted"
                }`}
            >
              {level.emoji} {level.name}
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-muted mt-2 italic">
          Hover on milestones to see the journey ahead
        </p>
      </div>
    </div>
  );
}
