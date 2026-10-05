import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Loader2, PenLine, Trash2, ScrollText } from "lucide-react";
import { toast } from "sonner";

import { Screen, SectionHead } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { Slider } from "@/components/ui/slider";
import { saveJournalEntry, fetchJournalEntries, type JournalEntry } from "@/services/nostr";
import { deleteLocalJournalEntry, logActivity } from "@/services/localStore";

const MAX_LENGTH = 4000;

const formatStamp = (timestamp: number): string =>
  new Date(timestamp).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await fetchJournalEntries();
      if (mounted.current) setEntries(data);
    } catch (error) {
      console.error("[Journal] Load failed", error);
      toast.error("Could not read your journal");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openComposer = () => {
    setComposing(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleSave = async () => {
    const text = content.trim();
    if (!text) {
      toast.error("Write something first");
      return;
    }

    setSaving(true);
    const entry: JournalEntry = {
      content: text,
      mood,
      energy,
      timestamp: Date.now(),
    };

    // Optimistic: the record is already durable locally, so show it immediately
    // instead of waiting on the relay round-trip.
    setEntries((prev) => [entry, ...prev]);
    const ok = await saveJournalEntry(entry);
    if (!mounted.current) return;

    setSaving(false);
    if (ok) {
      logActivity("journal_save", `Journal entry · mood ${mood}/10, energy ${energy}/10`);
      setContent("");
      setMood(5);
      setEnergy(5);
      setComposing(false);
      toast.success("Saved to this device");
    } else {
      toast.error("Device storage is full — the entry could not be saved");
      void load();
    }
  };

  const remove = (entry: JournalEntry) => {
    const ok = window.confirm("Delete this entry permanently?");
    if (!ok) return;
    deleteLocalJournalEntry(entry.timestamp);
    setEntries((prev) => prev.filter((e) => e.timestamp !== entry.timestamp));
  };

  return (
    <Screen title="Journal" subtitle="Private · stored on this device">
      {!composing && (
        <button
          type="button"
          onClick={openComposer}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ink text-label uppercase text-bg transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          New entry
        </button>
      )}

      {composing && (
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-section font-semibold text-ink">New entry</h2>
            <button
              type="button"
              onClick={() => {
                setComposing(false);
                setContent("");
              }}
              className="h-11 rounded-md px-3 text-label uppercase text-ink-faint hover:bg-surface-2 hover:text-ink"
            >
              Cancel
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(
              [
                { id: "mood", label: "Mood", value: mood, set: setMood, low: "storm", high: "calm" },
                { id: "energy", label: "Energy", value: energy, set: setEnergy, low: "depleted", high: "radiant" },
              ] as const
            ).map((field) => (
              <div key={field.id}>
                <div className="flex items-center justify-between">
                  <label htmlFor={`journal-${field.id}`} className="text-label uppercase text-ink-faint">
                    {field.label}
                  </label>
                  <span className="font-data text-data text-ink">
                    {field.value}
                    <span className="text-ink-faint">/10</span>
                  </span>
                </div>
                <Slider
                  id={`journal-${field.id}`}
                  value={[field.value]}
                  onValueChange={([v]) => field.set(v ?? 5)}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                  aria-label={`${field.label} from 1 to 10`}
                />
                <div className="mt-1 flex justify-between text-meta text-ink-faint">
                  <span>{field.low}</span>
                  <span>{field.high}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <label htmlFor="journal-body" className="text-label uppercase text-ink-faint">
              Reflection
            </label>
            <textarea
              id="journal-body"
              ref={textareaRef}
              value={content}
              maxLength={MAX_LENGTH}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What happened today, and what did you do about it?"
              className="mt-2 min-h-[160px] w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-3 text-body text-ink placeholder:text-ink-faint"
            />
            <p className="mt-1 text-right font-data text-meta text-ink-faint">
              {content.length}/{MAX_LENGTH}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !content.trim()}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ink text-label uppercase text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {saving ? "Saving" : "Save entry"}
          </button>
        </div>
      )}

      <SectionHead>{entries.length > 0 ? `${entries.length} entries` : undefined}</SectionHead>

      {loading ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-surface-2" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-8 w-8" aria-hidden="true" />}
          title="No entries yet"
          description="Write down what you did today and how it felt. Even one line is worth keeping."
          action={
            <button
              type="button"
              onClick={openComposer}
              className="h-11 rounded-md border border-border px-5 text-label uppercase text-ink hover:bg-surface-2"
            >
              Write the first one
            </button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id ?? entry.timestamp} className="card p-5">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <time
                  dateTime={new Date(entry.timestamp).toISOString()}
                  className="font-data text-meta text-ink-muted"
                >
                  {formatStamp(entry.timestamp)}
                </time>
                <button
                  type="button"
                  onClick={() => remove(entry)}
                  aria-label="Delete this entry"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-danger/5 hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-body leading-relaxed text-ink">
                {entry.content}
              </p>

              <p className="mt-3 flex gap-4 font-data text-meta text-ink-muted">
                <span>MOOD {entry.mood}/10</span>
                <span>ENERGY {entry.energy}/10</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}