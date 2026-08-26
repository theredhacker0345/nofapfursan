import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Sparkles } from "lucide-react";

export function CommunityButton() {
  return (
    <div className="card p-6 text-center relative animate-fade-in" style={{ animationDelay: "0.35s" }}>
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Users className="w-20 h-20 text-ink" />
      </div>

      <div className="flex flex-col items-center gap-3 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-sm">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-display text-ink tracking-wide">Fursan Brotherhood</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted mt-1">Community & Support</p>
        </div>
      </div>

      <p className="text-ink/70 text-sm mb-8 leading-relaxed px-2">
        Share your struggles, support others, and stay accountable with warriors on the same path.
      </p>

      <Link to="/community" className="block relative z-10 group">
        <Button className="w-full rounded-xl h-14 bg-accent text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-sm group-hover:shadow-xl group-hover:scale-[1.02] transition-all">
          <Sparkles className="w-4 h-4 mr-2" />
          Join The Resistance
        </Button>
      </Link>
    </div>
  );
}
