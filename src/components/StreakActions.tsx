import { Play, RotateCcw, AlertTriangle, Sparkles, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/hooks/use-toast";
import { luxuryClickVibrate, warningVibrate } from "@/lib/vibrationUtils";

interface StreakActionsProps {
  isActive: boolean;
  onStart: () => void;
  onReset: () => void;
}

export function StreakActions({ isActive, onStart, onReset }: StreakActionsProps) {
  const handleStart = async () => {
    onStart();
    await luxuryClickVibrate();

    toast({
      title: "Streak Started!",
      description: "Your journey begins now. Stay strong!",
    });
  };

  const handleReset = async () => {
    onReset();
    await warningVibrate();

    toast({
      title: "Streak Reset",
      description: "Falling once does not define you. Start again, wiser.",
      variant: "destructive",
    });
  };

  return (
    <div className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
      <div className="flex gap-4">
        {!isActive ? (
          <Button
            size="xl"
            className="flex-1 rounded-2xl h-20 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 bg-size-200 animate-gradient-x text-white font-black uppercase text-lg sm:text-xl tracking-widest shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all group"
            onClick={handleStart}
          >
            <Swords className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-4 group-hover:rotate-12 transition-transform" />
            <span className="truncate">START MY STREAK</span>
            <Sparkles className="ml-2 sm:ml-4 w-4 h-4 sm:w-6 sm:h-6 animate-pulse" />
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 rounded-xl h-14 border-2 border-rose-200 text-rose-500 hover:bg-rose-50 font-bold uppercase tracking-wider shadow-md hover:border-rose-300 transition-all"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset My Streak
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-amber-200 p-8 shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-amber-900 text-2xl font-display">
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                  Request Full Reset?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-amber-800/70 font-medium text-base pt-4">
                  This will set your streak back to zero. Your past progress will stay in your history.
                  <br /><br />
                  <span className="italic">"The path to mastery is paved with persistence, not perfection."</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="pt-6 gap-3">
                <AlertDialogCancel className="flex-1 rounded-xl h-12 bg-amber-50 text-amber-800 border-amber-200 font-bold">
                  Continue Battle
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="flex-1 rounded-xl h-12 bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                >
                  Reset Count
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
