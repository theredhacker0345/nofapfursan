import { Play, RotateCcw } from "lucide-react";
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
            className="flex-1 h-16 bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/95 hover:shadow-md active:scale-[0.99] transition-all"
            onClick={handleStart}
          >
            <Play className="w-5 h-5 mr-2" />
            <span className="truncate">Start my streak</span>
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14 border-outline-variant text-destructive hover:bg-destructive/5 font-medium transition-all"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset My Streak
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-semibold text-foreground">Reset your streak?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed pt-2">
                  This will set your streak back to zero. Your past progress will stay in your history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="pt-4 gap-3">
                <AlertDialogCancel className="flex-1 rounded-xl h-12 bg-secondary text-foreground border-border font-medium">
                  Keep Going
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="flex-1 rounded-xl h-12 bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90"
                >
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
