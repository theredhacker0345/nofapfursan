import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export function NotificationToggle() {
  const { enabled, toggleNotifications, permission, intervalHours, canScheduleAhead } =
    useNotifications();

  const handleToggle = async () => {
    const on = await toggleNotifications();

    if (on) {
      toast.success("Reminders on", {
        description: canScheduleAhead
          ? `A reminder every ${intervalHours}h on this device.`
          : "Browsers can only show reminders while Fursan is open.",
      });
    } else if (permission === "denied") {
      toast.error("Notifications blocked", {
        description: "Allow notifications for Fursan in your system settings.",
      });
    } else if (enabled) {
      toast("Reminders off");
    }
  };

  return (
    <div className="flex w-full items-center gap-3">
      <span
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border",
          enabled ? "bg-ink text-bg" : "bg-surface-2 text-ink-muted",
        )}
        aria-hidden="true"
      >
        {enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-body-s font-medium text-ink">Daily reminders</span>
        <span className="block text-meta text-ink-muted">
          {enabled ? `Every ${intervalHours}h` : "Off"}
        </span>
      </span>

      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={enabled}
        className={cn(
          "inline-flex h-11 shrink-0 items-center justify-center rounded-md px-5 text-label uppercase transition-opacity hover:opacity-90",
          enabled ? "border border-border text-ink-muted" : "bg-ink text-bg",
        )}
      >
        {enabled ? "Disable" : "Enable"}
      </button>
    </div>
  );
}