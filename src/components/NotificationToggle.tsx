import { Bell, BellOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "@/hooks/use-toast";

export function NotificationToggle() {
  const { enabled, toggleNotifications, isSupported, permission, intervalHours } = useNotifications();

  if (!isSupported) return null;

  const handleToggle = async () => {
    const result = await toggleNotifications();

    if (result) {
      toast({
        title: "Notifications Enabled 🔔",
        description: `You'll receive Islamic motivational reminders every ${intervalHours} hours`,
      });
    } else if (permission === "denied") {
      toast({
        title: "Notifications Blocked",
        description: "Please enable notifications in your browser settings",
        variant: "destructive",
      });
    } else if (!result && enabled) {
      toast({
        title: "Notifications Disabled",
        description: "You won't receive motivational reminders",
      });
    }
  };

  return (
    <div className="card p-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${enabled
            ? 'bg-ink shadow-sm'
            : 'bg-gradient-to-br from-muted to-muted'
            }`}>
            {enabled ? (
              <Bell className="w-5 h-5 text-white" />
            ) : (
              <BellOff className="w-5 h-5 text-ink-muted" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-ink flex items-center gap-1.5 truncate">
              <Sparkles className="w-4 h-4 text-ink flex-shrink-0" />
              Daily Reminders
            </h3>
            <p className="text-[11px] text-ink-muted font-medium leading-tight truncate">
              {enabled
                ? `On • Motivational reminders every ${intervalHours}h`
                : "Get motivational reminders"}
            </p>
          </div>
        </div>
        <Button
          onClick={handleToggle}
          className={`${enabled
            ? "bg-white border-2 border-border text-ink/80 hover:bg-surface-2"
            : "bg-ink text-white"
            } rounded-full px-4 sm:px-5 font-bold shadow-md hover:shadow-lg flex-shrink-0 text-xs sm:text-sm h-9 sm:h-10`}
        >
          {enabled ? "Disable" : "Enable"}
        </Button>
      </div>
    </div>
  );
}
