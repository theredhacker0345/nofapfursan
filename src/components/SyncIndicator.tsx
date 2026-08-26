/**
 * Sync Status Indicator Component
 * 
 * Shows the current Nostr sync status:
 * - Syncing animation when actively syncing
 * - Pending count when offline with queued events
 * - Offline indicator when disconnected
 */

import { Cloud, CloudOff, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncIndicatorProps {
    isSyncing: boolean;
    isOnline: boolean;
    pendingCount: number;
    className?: string;
}

export function SyncIndicator({
    isSyncing,
    isOnline,
    pendingCount,
    className,
}: SyncIndicatorProps) {
    // Determine the current state
    const getStatusContent = () => {
        if (isSyncing) {
            return {
                icon: <Loader2 className="h-4 w-4 animate-spin" />,
                text: "Syncing...",
                color: "text-on-surface-variant",
                bgColor: "bg-secondary-container",
                borderColor: "border-transparent",
            };
        }

        if (!isOnline) {
            return {
                icon: <CloudOff className="h-4 w-4" />,
                text: pendingCount > 0 ? `Offline (${pendingCount} pending)` : "Offline",
                color: "text-on-primary-container",
                bgColor: "bg-primary-container",
                borderColor: "border-transparent",
            };
        }

        if (pendingCount > 0) {
            return {
                icon: <Cloud className="h-4 w-4" />,
                text: `${pendingCount} pending`,
                color: "text-on-primary-container",
                bgColor: "bg-primary-container",
                borderColor: "border-transparent",
            };
        }

        // All synced and online
        return {
            icon: <CheckCircle2 className="h-4 w-4" />,
            text: "Synced",
            color: "text-on-tertiary-container",
            bgColor: "bg-tertiary-container",
            borderColor: "border-transparent",
        };
    };

    const status = getStatusContent();

    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                "border transition-colors duration-300",
                status.color,
                status.bgColor,
                status.borderColor,
                className
            )}
        >
            {status.icon}
            <span>{status.text}</span>
        </div>
    );
}

/**
 * Compact sync indicator for header/nav
 */
export function SyncIndicatorCompact({
    isSyncing,
    isOnline,
    pendingCount,
    className,
}: SyncIndicatorProps) {
    if (isSyncing) {
        return (
            <div className={cn("relative", className)}>
                <Cloud className="h-5 w-5 text-primary" />
                <Loader2 className="absolute -top-1 -right-1 h-3 w-3 text-primary animate-spin" />
            </div>
        );
    }

    if (!isOnline) {
        return (
            <div className={cn("relative flex-shrink-0", className)}>
                <CloudOff className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-secondary text-black text-[9px] sm:text-[10px] font-bold px-1 rounded-full min-w-[14px] sm:min-w-[16px] text-center">
                        {pendingCount}
                    </span>
                )}
            </div>
        );
    }

    if (pendingCount > 0) {
        return (
            <div className={cn("relative", className)}>
                <Cloud className="h-5 w-5 text-primary" />
                <span className="absolute -top-1 -right-2 bg-secondary text-black text-[10px] font-bold px-1 rounded-full min-w-[16px] text-center">
                    {pendingCount}
                </span>
            </div>
        );
    }

    return <Cloud className={cn("h-5 w-5 text-accent", className)} />;
}
