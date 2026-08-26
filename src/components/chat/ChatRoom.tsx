import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNostr } from "@/hooks/useNostr";
import { RELAYS, fetchHealthChecks } from "@/services/nostr";
import { generateOrLoadKeys, NostrKeys } from "@/services/nostr";
import { finalizeEvent, Event, Filter } from "nostr-tools";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { hasAuraBonus, calculateStreak, getStreakData } from "@/lib/streakUtils";

// nostr-tools' SimplePool exposes subscribe() with these params at runtime
interface PoolSubscriber {
  subscribe(
    relays: string[],
    filter: Filter,
    params: { onevent?: (event: Event) => void; oneose?: () => void; onclose?: () => void }
  ): { close: () => void };
}

interface Message {
  id: string;
  content: string;
  pubkey: string;
  created_at: number;
  status?: 'sending' | 'sent' | 'received' | 'failed';
  streak?: number;
  bonus?: string;
}

interface ChatRoomProps {
  roomId: string;
}

const BROADCAST_TIMEOUT = 5000; // 5 seconds

const ROOM_IDS: Record<string, string> = {
  global: "0000000000000000000000000000000000000000000000000000000000000001",
  beginners: "0000000000000000000000000000000000000000000000000000000000000002",
  veterans: "0000000000000000000000000000000000000000000000000000000000000003"
};

export function ChatRoom({ roomId }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { events, subscribe, publish, profiles, setProfiles, pool } = useNostr();
  const [identity, setIdentity] = useState<NostrKeys | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const getShortId = (pubkey: string) => `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`;

  useEffect(() => {
    generateOrLoadKeys().then(setIdentity);
  }, []);

  useEffect(() => {
    if (!identity) return;
    console.log(`[CHAT-DEBUG] Room Switch: ${roomId} (ID: ${ROOM_IDS[roomId]})`);
    setMessages([]); // Explicitly clear on room/identity change
    const unsub = subscribe({
      kinds: [42],
      '#e': [ROOM_IDS[roomId]],
      limit: 100
    });
    return () => unsub && unsub();
  }, [identity, subscribe, roomId]);

  useEffect(() => {
    // Process incoming events
    const incomingMessages = events
      .filter(event => {
        const isKind42 = event.kind === 42;
        const matchesRoom = event.tags.some(t => t[0] === 'e' && t[1] === ROOM_IDS[roomId]);
        if (isKind42 && !matchesRoom) {
          console.warn(`[CHAT-DEBUG] Filtering out Kind 42 from different room: ${event.id}`);
        }
        return isKind42 && matchesRoom;
      })
      .map(event => {
        const streakTag = event.tags.find(t => t[0] === 'streak');
        const bonusTag = event.tags.find(t => t[0] === 'bonus');

        return {
          id: event.id!,
          content: event.content,
          pubkey: event.pubkey,
          created_at: event.created_at,
          status: 'received' as const,
          streak: streakTag ? parseInt(streakTag[1]) : undefined,
          bonus: bonusTag ? bonusTag[1] : undefined
        };
      });

    console.log(`[CHAT-DEBUG] Received ${incomingMessages.length} messages for ${roomId}`);

    setMessages(prev => {
      // Merge incoming with existing, avoiding duplicates
      const existingIds = new Set(prev.map(m => m.id));
      const newFromRelay = incomingMessages.filter(m => !existingIds.has(m.id));

      // Filter out optimistic/failed messages that now have a relay counterpart
      const filteredPrev = prev.filter(p => {
        if (p.status === 'sending' || p.status === 'failed') {
          const hasConfirmation = incomingMessages.some(m => m.content === p.content && m.pubkey === p.pubkey);
          if (hasConfirmation) {
            // Clear timeout if message was confirmed
            const timeout = timeoutRefs.current.get(p.id);
            if (timeout) {
              clearTimeout(timeout);
              timeoutRefs.current.delete(p.id);
            }
            return false;
          }
        }
        return true;
      });

      return [...filteredPrev, ...newFromRelay].sort((a, b) => a.created_at - b.created_at);
    });
  }, [events, roomId]);

  const requestedProfilesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    // When messages arrive, find unique pubkeys and ask for their names.
    // Guard with a ref so we don't open a new subscription per message.
    const unknownPubkeys = messages
      .filter(m => !profiles[m.pubkey] && !requestedProfilesRef.current.has(m.pubkey))
      .map(m => m.pubkey);

    if (unknownPubkeys.length > 0) {
      unknownPubkeys.forEach(pk => requestedProfilesRef.current.add(pk));
      const sub = (pool as unknown as PoolSubscriber).subscribe(RELAYS,
        { kinds: [0], authors: unknownPubkeys },
        {
          onevent: (event: Event) => {
            try {
              const data = JSON.parse(event.content);
              setProfiles(prev => ({
                ...prev,
                [event.pubkey]: data.display_name || data.name || "Warrior"
              }));
            } catch (e) {
              console.error("Failed to parse profile metadata", e);
            }
          }
        }
      );
      return () => sub.close();
    }
  }, [messages, profiles, pool, setProfiles]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const refs = timeoutRefs.current;
    return () => {
      refs.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const sendMessage = useCallback(async (content: string, tempId: string, streakDays: number, aura: boolean) => {
    if (!identity?.privateKey) return;

    try {
      const tags = [
        ['e', ROOM_IDS[roomId], '', 'root'],
        ['t', 'nofapfursan'],
        ['streak', streakDays.toString()]
      ];

      if (aura) {
        tags.push(['bonus', 'aura']);
      }

      const eventTemplate = {
        kind: 42,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content,
      };

      const signedEvent = finalizeEvent(eventTemplate, identity.privateKey);

      // Set timeout to mark as failed after 5s
      const timeout = setTimeout(() => {
        setMessages(prev => prev.map(m =>
          m.id === tempId && m.status === 'sending'
            ? { ...m, status: 'failed' as const }
            : m
        ));
        timeoutRefs.current.delete(tempId);
      }, BROADCAST_TIMEOUT);

      timeoutRefs.current.set(tempId, timeout);

      // The publish function in NostrContext handles the "OK" check and race-to-success logic
      const success = await publish(signedEvent as Event);

      if (!success) {
        clearTimeout(timeout);
        timeoutRefs.current.delete(tempId);
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, status: 'failed' as const } : m
        ));
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, status: 'failed' as const } : m
      ));
    }
  }, [identity, publish, roomId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || !identity || !identity.privateKey) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const streakData = await getStreakData();
    const currentStreak = calculateStreak(streakData.startDate);
    const healthHistory = await fetchHealthChecks();
    const hasAura = hasAuraBonus(healthHistory);

    const optimisticMsg: Message = {
      id: tempId,
      content,
      pubkey: identity.publicKey,
      created_at: Math.floor(Date.now() / 1000),
      status: 'sending',
      streak: currentStreak.days,
      bonus: hasAura ? 'aura' : undefined
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");

    await sendMessage(content, tempId, currentStreak.days, hasAura);
  };

  const handleRetry = async (message: Message) => {
    setMessages(prev => prev.map(m =>
      m.id === message.id ? { ...m, status: 'sending' as const } : m
    ));
    await sendMessage(message.content, message.id, message.streak ?? 0, message.bonus === 'aura');
  };

  return (
    <div className="border border-black flex flex-col h-[600px] bg-white animate-in fade-in duration-500">
      <div className="bg-black text-white px-4 py-2 flex items-center justify-between">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          {roomId} Channel
        </h2>
        <span className="text-[9px] font-mono opacity-50 uppercase">Fursan v1.0</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-thin scrollbar-thumb-black">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-2">
            <Send className="w-8 h-8" />
            <p className="text-[10px] uppercase font-bold tracking-widest">No signals detected</p>
          </div>
        )}
        {messages.map((message) => {
          const isOwn = identity && message.pubkey === identity.publicKey;
          const isSending = message.status === 'sending';
          const isFailed = message.status === 'failed';

          return (
            <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-1 duration-300`}>
              <div className={`max-w-[85%] space-y-1 ${isOwn ? "text-right" : "text-left"}`}>
                <div className={`px-4 py-2 border border-black ${isOwn ? "bg-black text-white" : "bg-white text-black"} ${isSending ? "opacity-40 grayscale" : ""} ${isFailed ? "border-red-500 opacity-60" : ""}`}>
                  <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${message.bonus === 'aura' ? 'aura-effect' : 'opacity-50'}`}>
                    {profiles[message.pubkey] || `user:${message.pubkey.slice(0, 5)}`}
                    {message.streak !== undefined && (
                      <span className="ml-1 text-[7px] text-orange-500">
                        ({message.streak} DAY STREAK 🔥)
                      </span>
                    )}
                  </p>
                  <p className="text-sm font-medium leading-relaxed break-words">{message.content}</p>
                </div>
                <div className={`flex items-center gap-2 ${isOwn ? "justify-end" : "justify-start"} px-1`}>
                  {isSending ? (
                    <div className="flex items-center gap-1">
                      <Loader2 className="w-2 h-2 animate-spin" />
                      <span className="text-[8px] uppercase font-black tracking-tighter">Broadcasting...</span>
                    </div>
                  ) : isFailed ? (
                    <button
                      onClick={() => handleRetry(message)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                    >
                      <AlertCircle className="w-2 h-2" />
                      <span className="text-[8px] uppercase font-black tracking-tighter">Failed</span>
                      <RefreshCw className="w-2 h-2 ml-1" />
                      <span className="text-[8px] uppercase font-black tracking-tighter">Retry</span>
                    </button>
                  ) : (
                    <p className="text-[8px] uppercase font-bold tracking-tighter opacity-30">
                      {formatDistanceToNow(new Date(message.created_at * 1000), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-black bg-secondary/30">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="ENCRYPT SIGNAL..."
            className="flex-1 border-black rounded-none h-12 bg-white text-xs font-bold uppercase tracking-widest px-4 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:opacity-30"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || !identity}
            aria-label="Send message"
            className="border border-black rounded-none h-12 w-12 bg-black text-white hover:bg-black/90 flex items-center justify-center p-0 transition-all active:scale-90"
          >
            <Send className="w-5 h-5" aria-hidden="true" />
          </Button>
        </form>
      </div>
    </div>
  );
}
