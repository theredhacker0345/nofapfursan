import { Info, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function ChatRules() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("fursan_chat_rules_seen");
    if (seen) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("fursan_chat_rules_seen", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground text-sm mb-2">Community Guidelines</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Be supportive and respectful to others on their journey</li>
              <li>• No hate speech, slurs, or harassment</li>
              <li>• No explicit or sexual content</li>
              <li>• Casual language is fine, but excessive profanity gets filtered</li>
            </ul>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Dismiss community guidelines"
          onClick={handleDismiss}
          className="flex-shrink-0 h-8 w-8 rounded-full hover:bg-primary/20"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
