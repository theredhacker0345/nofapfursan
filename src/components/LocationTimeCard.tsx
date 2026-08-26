import { useState, useEffect } from "react";
import { Clock, MapPin, Settings } from "lucide-react";
import { motion } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { LocationSettings } from "./LocationSettings";

export function LocationTimeCard() {
    const [time, setTime] = useState(new Date());
    const [location, setLocation] = useState("Sanctum");
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const updateLocation = () => {
            const mode = localStorage.getItem('fursan_location_mode') || 'auto';
            if (mode === 'manual') {
                const city = localStorage.getItem('fursan_manual_city');
                if (city) setLocation(city);
                else setLocation("Manual Sector");
            } else {
                // Get timezone-based location name
                try {
                    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    if (tz) {
                        const city = tz.split('/').pop()?.replace('_', ' ');
                        if (city) setLocation(city);
                    }
                } catch (e) {
                    console.error("Failed to detect timezone", e);
                }
            }
        };

        // Update time every second
        const timer = setInterval(() => setTime(new Date()), 1000);
        updateLocation();

        const handleUpdate = async () => {
            const { clearPrayerCache } = await import("@/lib/prayerUtils");
            clearPrayerCache();
            updateLocation();
        };
        window.addEventListener('fursan_location_settings_updated', handleUpdate);

        return () => {
            clearInterval(timer);
            window.removeEventListener('fursan_location_settings_updated', handleUpdate);
        };
    }, []);

    const formatTime = (date: Date) => {
        const mode = localStorage.getItem('fursan_location_mode') || 'auto';
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };

        if (mode === 'manual') {
            const tz = localStorage.getItem('fursan_manual_timezone');
            if (tz) options.timeZone = tz;
        }

        try {
            return date.toLocaleTimeString([], options);
        } catch (e) {
            console.error("[Vigil] Invalid timezone format detected, falling back to local time.");
            // Fallback: exclude the custom options that might have invalid timezone
            return date.toLocaleTimeString();
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString([], {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="royal-card p-5 overflow-hidden page-transition" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Clock className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black uppercase tracking-tight text-amber-800">Local Vigil</h3>
                            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                                <DialogTrigger asChild>
                                    <button
                                        aria-label="Location settings"
                                        className="p-2.5 hover:bg-amber-100 rounded-full transition-colors"
                                    >
                                        <Settings className="w-4 h-4 text-amber-600/70" />
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="bg-background border-2 border-border p-6 rounded-[2rem] shadow-2xl max-h-[80vh] overflow-y-auto w-[95%]">
                                    <DialogHeader className="mb-4">
                                        <DialogTitle className="text-amber-900 font-display text-xl uppercase tracking-widest">Sector Protocol</DialogTitle>
                                    </DialogHeader>
                                    <LocationSettings />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-amber-500/50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600/50">
                                {location} Sector
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <motion.p
                        key={time.getSeconds()}
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        className="text-2xl font-black text-gradient-gold tabular-nums leading-none"
                    >
                        {formatTime(time)}
                    </motion.p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/40 mt-1">
                        {formatDate(time)}
                    </p>
                </div>
            </div>
        </div>
    );
}
