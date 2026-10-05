import { useState } from "react";
import { RefreshCw, Quote } from "lucide-react";
import { getRandomMotivation } from "@/data/motivation";

/**
 * The quote is set at `text-title` — it used to render at 64px, larger than the
 * streak number itself, and it carried a `text-ink-muted/50/50` class (a
 * double-alpha typo Tailwind generates nothing for) so the glyph had no colour.
 */
export function MotivationCard() {
  const [motivation, setMotivation] = useState(() => getRandomMotivation());

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-label uppercase text-ink-faint">Today&apos;s line</p>
        <button
          type="button"
          aria-label="Show another line"
          onClick={() => setMotivation(getRandomMotivation())}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <figure className="mt-2">
        <blockquote className="text-title font-medium leading-snug text-ink">
          <Quote
            className="mr-1 inline-block h-4 w-4 -translate-y-0.5 text-ink-faint"
            aria-hidden="true"
          />
          {motivation.text}
        </blockquote>
        {motivation.source && (
          <figcaption className="mt-2 text-meta text-ink-muted">— {motivation.source}</figcaption>
        )}
      </figure>
    </div>
  );
}