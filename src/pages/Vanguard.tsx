import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Loader2,
  RefreshCw,
  AlertCircle,
  Radio,
  MessageSquare,
  TriangleAlert,
  ScrollText,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { finalizeEvent, type Event } from "nostr-tools";

import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { useNostr } from "@/hooks/useNostr";
import { useNostrContext } from "@/context/NostrContext";
import { generateOrLoadKeys, fetchHealthChecks, type NostrKeys } from "@/services/nostr";
import { getLocalHealthChecks } from "@/services/localStore";
import { hasAuraBonus, calculateStreak, getStreakData } from "@/lib/streakUtils";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  pubkey: string;
  created_at: number;
  status: "sending" | "sent" | "received" | "failed";
  streak?: number;
  bonus?: string;
}

const BROADCAST_TIMEOUT = 8000;
const ROOM_ID = "0000000000000000000000000000000000000000000000000000000000000001";

const CHANNELS: { id: string; label: string; Icon: LucideIcon; blurb: string }[] = [
  { id: "fursan_general", label: "General", Icon: MessageSquare, blurb: "Strategy and everything else" },
  { id: "fursan_sos", label: "SOS", Icon: TriangleAlert, blurb: "Struggling right now" },
  { id: "fursan_motivation", label: "Motivation", Icon: Radio, blurb: "Share what worked" },
  { id: "fursan_fiqh", label: "Learn", Icon: ScrollText, blurb: "Questions and references" },
];

const shortId = (pubkey: string) => `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;

const clockTime = (seconds: number) =>
  new Date(seconds * 1000).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

/**
 * One chat, one name, one scroll container.
 *
 * Previously this screen was titled "Community" while living at `/vanguard` and
 * being labelled "Chat" in the nav, sat next to a second full chat app at
 * `/community`, and rendered message bylines at 8px. Its kind-0 profile lookup
 * was subscribed inside an effect keyed on `[messages, profiles]`, so every
 * arriving message tore down the in-flight request and profiles never resolved.
 * Profile resolution now lives once in NostrContext with an app-wide cache.
 */
export default function Vanguard() {
  const { events, subscribe, publish, profiles } = useNostr();
  const { connectedRelays } = useNostrContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [channel, setChannel] = useState(CHANNELS[0].id);
  const [identity, setIdentity] = useState<NostrKeys | null>(null);
  const [ready, setReady] = useState(false);
  const timeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    generateOrLoadKeys()
      .then((id) => {
        if (cancelled) return;
        setIdentity(id);
        setReady(true);
      })
      .catch((error) => {
        console.error("[Vanguard] Identity unavailable", error);
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * A channel switch starts a new conversation. Only the event buffer was being
   * cleared, so the reconcile effect below kept every non-optimistic message and
   * each channel opened showing the previous channel's entire history.
   */
  useEffect(() => {
    setMessages([]);
    const close = subscribe({ kinds: [42], "#e": [ROOM_ID], "#t": [channel], limit: 50 });
    return close;
  }, [subscribe, channel]);

  /* Relay events → message list, reconciling optimistic sends. */
  useEffect(() => {
    const incoming: Message[] = events
      .filter((event) => event.kind === 42)
      .map((event) => {
        const streakTag = event.tags.find((t) => t[0] === "streak");
        const bonusTag = event.tags.find((t) => t[0] === "bonus");
        return {
          id: event.id,
          content: event.content,
          pubkey: event.pubkey,
          created_at: event.created_at,
          status: "received" as const,
          streak: streakTag ? Number.parseInt(streakTag[1], 10) : undefined,
          bonus: bonusTag?.[1],
        };
      });

    setMessages((prev) => {
      const incomingIds = new Set(incoming.map((m) => m.id));
      const confirmed = incoming.map((m) => `${m.pubkey}|${m.content}`);

      const kept = prev.filter((p) => {
        if (incomingIds.has(p.id)) return false;
        if (p.status === "sending" || p.status === "failed") {
          if (confirmed.includes(`${p.pubkey}|${p.content}`)) {
            const timer = timeouts.current.get(p.id);
            if (timer) {
              clearTimeout(timer);
              timeouts.current.delete(p.id);
            }
            return false;
          }
        }
        return true;
      });

      const fresh = incoming.filter((m) => !kept.some((k) => k.id === m.id));
      return [...kept, ...fresh].sort((a, b) => a.created_at - b.created_at).slice(-200);
    });
  }, [events]);

  useEffect(() => {
    const map = timeouts.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);



  const participants = useMemo(() => new Set(messages.map((m) => m.pubkey)).size, [messages]);

  const send = useCallback(
    async (content: string, tempId: string, streakDays: number, aura: boolean) => {
      if (!identity) return;
      const tags: string[][] = [
        ["e", ROOM_ID, "", "root"],
        ["t", channel],
        ["t", "nofapfursan"],
        ["streak", String(streakDays)],
      ];
      if (aura) tags.push(["bonus", "aura"]);

      const signed = finalizeEvent(
        { kind: 42, created_at: Math.floor(Date.now() / 1000), tags, content },
        identity.privateKey,
      );

      const markFailed = () =>
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "failed" as const } : m)),
        );

      const timer = setTimeout(markFailed, BROADCAST_TIMEOUT);
      timeouts.current.set(tempId, timer);

      const ok = await publish(signed as unknown as Event);
      if (ok) {
        clearTimeout(timer);
        timeouts.current.delete(tempId);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "sent" as const } : m)),
        );
      }
    },
    [identity, publish, channel],
  );

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    if (!identity) {
      return;
    }

    const tempId = `local-${Date.now()}`;
    // Local-only reads — no relay round-trip before the message appears.
    const streak = calculateStreak((await getStreakData()).startDate).days;
    const aura = hasAuraBonus(getLocalHealthChecks());
    void fetchHealthChecks(); // warm the relay copy in the background

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content,
        pubkey: identity.publicKey,
        created_at: Math.floor(Date.now() / 1000),
        status: "sending",
        streak,
        bonus: aura ? "aura" : undefined,
      },
    ]);
    setDraft("");
    void send(content, tempId, streak, aura);
  };

  const retry = (message: Message) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, status: "sending" as const } : m)),
    );
    void send(message.content, message.id, message.streak ?? 0, message.bonus === "aura");
  };

  const online = connectedRelays.length;

  return (
    <Screen title="Vanguard" subtitle="Public relay chat" bare>
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
        <div className="flex items-center gap-2 py-3">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              online > 0 ? "bg-success" : "bg-danger",
            )}
            aria-hidden="true"
          />
          <p className="text-meta text-ink-muted">
            {online > 0
              ? `${online} relay${online === 1 ? "" : "s"} live`
              : "No relay connection — messages will fail to send"}
          </p>
          {participants > 0 && (
            <p className="ml-auto font-data text-meta text-ink-faint">{participants} here</p>
          )}
        </div>

        {/* The four channels do not fit a 390px viewport, so the row scrolls.
            Without an edge cue the last one just looks clipped. */}
        <div
          className="no-scrollbar relative -mx-5 flex gap-2 overflow-x-auto px-5 pb-3"
          role="tablist"
          aria-label="Channels"
          style={{
            maskImage: "linear-gradient(to right, #000 0, #000 calc(100% - 24px), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, #000 0, #000 calc(100% - 24px), transparent 100%)",
          }}
        >
          {CHANNELS.map(({ id, label, Icon, blurb }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={channel === id}
              onClick={() => setChannel(id)}
              title={blurb}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border px-3.5 text-meta font-medium transition-colors duration-fast",
                channel === id
                  ? "border-ink bg-ink text-bg"
                  : "border-border text-ink-muted hover:border-ink-faint hover:text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <div
          ref={listRef}
          className={cn(
            "h-[52vh] min-h-[320px] space-y-3 overflow-y-auto rounded-lg border border-border bg-surface px-4 py-4",
            messages.length === 0 && "flex flex-col justify-center",
          )}
        >
          {messages.length === 0 ? (
            <EmptyState
              icon={<Radio className="h-7 w-7" aria-hidden="true" />}
              title="Quiet in here"
              description="Nothing has been said in this channel recently."
              className="my-auto border-0 bg-transparent py-10"
            />
          ) : (
            messages.map((message) => {
              const mine = identity?.publicKey === message.pubkey;
              const name = profiles[message.pubkey] ?? shortId(message.pubkey);
              return (
                <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%]", mine ? "text-right" : "text-left")}>
                    <div
                      className={cn(
                        "rounded-lg border px-4 py-3 text-left",
                        mine
                          ? "border-ink bg-ink text-bg"
                          : "border-border bg-surface-2 text-ink",
                        message.status === "sending" && "opacity-60",
                        message.status === "failed" && "border-danger",
                      )}
                    >
                      <p
                        className={cn(
                          "mb-1 flex items-center gap-2 font-data text-meta",
                          mine ? "text-bg/70" : "text-ink-muted",
                        )}
                      >
                        {name}
                        {message.streak !== undefined && (
                          <span className={cn(mine ? "text-bg/70" : "text-ink-faint")}>
                            {message.streak}d
                          </span>
                        )}
                        {message.bonus === "aura" && (
                          <span className="text-accent" title="5+ day check-in streak">
                            aura
                          </span>
                        )}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-body leading-relaxed">
                        {message.content}
                      </p>
                    </div>

                    <p className="mt-1 px-1 font-data text-meta text-ink-faint">
                      {message.status === "sending" ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                          sending
                        </span>
                      ) : message.status === "failed" ? (
                        <button
                          type="button"
                          onClick={() => retry(message)}
                          className="inline-flex items-center gap-1 text-danger hover:underline"
                        >
                          <AlertCircle className="h-3 w-3" aria-hidden="true" />
                          not sent
                          <RefreshCw className="h-3 w-3" aria-hidden="true" />
                          retry
                        </button>
                      ) : (
                        clockTime(message.created_at)
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="mt-3 flex gap-2">
          <label htmlFor="vanguard-composer" className="sr-only">
            Message
          </label>
          <input
            id="vanguard-composer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a message…"
            maxLength={1000}
            autoComplete="off"
            className="h-12 min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-4 text-body text-ink placeholder:text-ink-faint"
          />
          <button
            type="submit"
            disabled={!draft.trim() || !identity}
            aria-label="Send message"
            className={cn(
              "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md transition-colors duration-fast",
              draft.trim() && identity
                ? "bg-ink text-bg hover:opacity-90"
                : "border border-border bg-surface-2 text-ink-faint",
            )}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>

        <p className="mt-3 inline-flex items-start gap-1.5 text-meta text-ink-faint">
          <Eye className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          Messages are public, signed Nostr events on relays. Never post anything you
          would not sign your name to.
        </p>
      </div>
    </Screen>
  );
}