import { useState } from "react";
import { Button } from "@/components/ui/button";
import { clearKeys } from "@/services/nostr";
import { ShieldAlert, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function PrivacySettings() {
    const [incinerating, setIncinerating] = useState(false);

    const handleIncinerate = async () => {
        setIncinerating(true);
        try {
            await clearKeys();
            // Force a reload to reset all state cleanly
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            toast.success("Done. All local data has been erased.");
        } catch (error) {
            console.error("Data erase failed", error);
            toast.error("Could not erase data. Please clear app data manually.");
            setIncinerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <ShieldAlert className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-800 truncate">
                        Your Data Is Safe
                    </h3>
                    <p className="text-[10px] text-emerald-700/60 font-medium break-words leading-tight">
                        Your identity and streak are stored encrypted on this device only.
                    </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto flex-shrink-0" />
            </div>

            <div className="p-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-800 mb-3 flex items-center gap-2">
                    <Trash2 className="w-3 h-3" />
                    Danger Zone
                </h4>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-lg shadow-red-500/20"
                            disabled={incinerating}
                        >
                            {incinerating ? "ERASING..." : "ERASE EVERYTHING"}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-2 border-red-500 bg-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-600 font-black uppercase tracking-widest">
                                Erase All Data?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-stone-600 font-medium">
                                This will PERMANENTLY delete your private key, streak history, and all local data from this device.
                                <br /><br />
                                <strong>This action cannot be undone.</strong> If you haven't backed up your Nostr key (use Export Key in Profile), you will lose your account forever.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="font-bold uppercase tracking-widest">ABORT</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleIncinerate}
                                className="bg-red-600 text-white font-black uppercase tracking-widest hover:bg-red-700"
                            >
                                CONFIRM DESTRUCTION
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
