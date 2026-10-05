import { Lock, Check, Eye } from "lucide-react";
import { toast } from "sonner";

import { THEMES } from "@/data/themes";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

/**
 * Flat list rows inside one surface group. Previously each theme was its own
 * nested card and the row wrapped a `<Button>` inside a `<button>` — invalid
 * interactive nesting that also broke keyboard activation.
 */
export function ThemeSelector() {
  const { currentTheme, setTheme, previewTheme, unlockedThemes } = useTheme();

  const select = (id: string, unlocked: boolean) => {
    if (!unlocked) {
      toast.error("Theme locked", {
        description: `Reach day ${THEMES.find((t) => t.id === id)?.minDays ?? "?"} to unlock it.`,
      });
      return;
    }
    void setTheme(id);
  };

  return (
    <ul>
      {THEMES.map((theme) => {
        const unlocked = unlockedThemes.includes(theme.id);
        const selected = currentTheme.id === theme.id;

        return (
          <li key={theme.id} className="row">
            <span
              className="h-8 w-8 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: theme.preview }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-s font-medium text-ink">
                {theme.name}
                {selected && <span className="sr-only"> (current)</span>}
              </span>
              <span className="block truncate text-meta text-ink-muted">
                {unlocked ? theme.description : `Unlocks at day ${theme.minDays}`}
              </span>
            </span>

            {unlocked ? (
              <button
                type="button"
                onClick={() => {
                  previewTheme(theme.id);
                  toast("Previewing for 3 seconds");
                }}
                aria-label={`Preview the ${theme.name} theme`}
                title="Preview for 3 seconds"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <Lock className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
            )}

            <button
              type="button"
              disabled={!unlocked || selected}
              onClick={() => select(theme.id, unlocked)}
              aria-pressed={selected}
              aria-label={`Use the ${theme.name} theme`}
              className={cn(
                "inline-flex h-11 w-[72px] shrink-0 items-center justify-center rounded-md text-label uppercase transition-colors",
                selected
                  ? "cursor-default text-accent"
                  : "bg-ink text-bg hover:opacity-90",
                // A locked theme must not read as an actionable button.
                !unlocked && "cursor-not-allowed opacity-30 hover:opacity-30",
              )}
            >
              {selected ? <Check className="h-4 w-4" aria-hidden="true" /> : "Use"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}