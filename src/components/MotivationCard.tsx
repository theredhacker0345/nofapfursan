import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Quote } from "lucide-react";
import { getRandomMotivation } from "@/data/motivation";
import { Button } from "@/components/ui/button";

export function MotivationCard() {
  const [motivation, setMotivation] = useState<{ text: string, source?: string } | null>(null);

  useEffect(() => {
    setMotivation(getRandomMotivation());
  }, []);

  const refreshQuote = () => {
    setMotivation(getRandomMotivation());
  };

  if (!motivation) return null;

  return (
    <div className="royal-card p-6 page-transition" style={{ animationDelay: "0.25s" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-foreground font-bold uppercase tracking-widest text-xs">Daily Wisdom</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Show another quote"
          onClick={refreshQuote}
          className="text-muted-foreground hover:text-muted-foreground hover:bg-secondary/50"
        >
          <RefreshCw className="w-5 h-5" aria-hidden="true" />
        </Button>
      </div>

      <div className="relative">
        <Quote className="absolute -top-4 -left-2 w-10 h-10 text-muted-foreground/50/50 rotate-180" />
        <blockquote className="text-xl md:text-2xl font-display text-foreground leading-tight mb-4 relative z-10 px-2 break-words">
          {motivation.text}
        </blockquote>
        {motivation.source && (
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-right pr-2">
            — {motivation.source}
          </p>
        )}
      </div>
    </div>
  );
}
