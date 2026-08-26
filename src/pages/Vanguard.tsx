import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, RefreshCw, AlertCircle, Radio, Shield, Users, MessageSquare, AlertTriangle, Scroll, Sparkles } from "lucide-react";
import { useNostr } from "@/hooks/useNostr";
import { RELAYS, fetchHealthChecks } from "@/services/nostr";
import { generateOrLoadKeys, NostrKeys } from "@/services/nostr";
import { finalizeEvent, Event, Filter } from "nostr-tools";
import { formatDistanceToNow } from "date-fns";
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

const BROADCAST_TIMEOUT = 5000;
const GLOBAL_ROOM_ID = "0000000000000000000000000000000000000000000000000000000000000001";

const CHANNELS = [
    { id: 'fursan_general', label: 'General', icon: MessageSquare, desc: 'Public Chat' },
    { id: 'fursan_sos', label: 'SOS', icon: AlertTriangle, desc: 'Help Needed' },
    { id: 'fursan_motivation', label: 'Motivation', icon: Sparkles, desc: 'Be Inspired' },
    { id: 'fursan_fiqh', label: 'Learn', icon: Scroll, desc: 'Questions & Answers' },
];

export default function Vanguard() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [activeChannel, setActiveChannel] = useState("fursan_general");
    const [identity, setIdentity] = useState<NostrKeys | null>(null);
    const [loading, setLoading] = useState(true);
    const { events, subscribe, publish, profiles, setProfiles, pool, connectedRelays } = useNostr();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const getShortId = (pubkey: string) => `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`;

    useEffect(() => {
        generateOrLoadKeys().then(id => {
            setIdentity(id);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!identity) return;
        setMessages([]);
        const unsub = subscribe({
            kinds: [42],
            '#e': [GLOBAL_ROOM_ID],
            '#t': [activeChannel],
            limit: 50
        });
        return () => unsub && unsub();
    }, [identity, subscribe, activeChannel]);

    useEffect(() => {
        const incomingMessages = events
            .filter(event => {
                const isKind42 = event.kind === 42;
                const matchesRoom = event.tags.some(t => t[0] === 'e' && t[1] === GLOBAL_ROOM_ID);
                const matchesChannel = event.tags.some(t => t[0] === 't' && t[1] === activeChannel);
                return isKind42 && matchesRoom && matchesChannel;
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

        setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newFromRelay = incomingMessages.filter(m => !existingIds.has(m.id));

            const filteredPrev = prev.filter(p => {
                if (p.status === 'sending' || p.status === 'failed') {
                    const hasConfirmation = incomingMessages.some(m => m.content === p.content && m.pubkey === p.pubkey);
                    if (hasConfirmation) {
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
    }, [events, activeChannel]);

    // Track pubkeys we've already requested profiles for to avoid re-subscribing
    // on every incoming message
    const requestedProfilesRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        const unknownPubkeys = messages
            .filter(m => !profiles[m.pubkey] && !requestedProfilesRef.current.has(m.pubkey))
            .map(m => m.pubkey);

        if (unknownPubkeys.length > 0 && pool) {
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
                ['e', GLOBAL_ROOM_ID, '', 'root'],
                ['t', activeChannel],
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

            const timeout = setTimeout(() => {
                setMessages(prev => prev.map(m =>
                    m.id === tempId && m.status === 'sending'
                        ? { ...m, status: 'failed' as const }
                        : m
                ));
                timeoutRefs.current.delete(tempId);
            }, BROADCAST_TIMEOUT);

            timeoutRefs.current.set(tempId, timeout);

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
    }, [identity, publish, activeChannel]);

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

    if (loading) {
        return <LoadingScreen message="Joining the chat..." subMessage="Loading messages..." />;
    }

    return (
        <div className="min-h-screen bg-bg pb-24">
            <div className="container max-w-lg mx-auto px-4">
                <Header />

                {/* Vanguard Header */}
                <header className="mb-4 mt-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-ink flex items-center justify-center shadow-lg shadow-sm">
                                <Radio className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-display text-ink tracking-tight">Community</h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ink-muted">Chat with everyone</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-surface-2 px-3 py-1.5 rounded-full border border-border">
                            <div className={`w-2 h-2 rounded-full ${connectedRelays.length > 0 ? 'bg-surface-2 animate-pulse' : 'bg-danger/50 animate-ping'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-ink">
                                {connectedRelays.length > 0 ? `${connectedRelays.length} ONLINE` : 'CONNECTING...'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Chat Container */}
                <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
                    <div className="card overflow-hidden">
                        {/* Channel Header */}
                        <div className="bg-surface-2/60 px-4 py-3 border-b border-border">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-ink" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ink">
                                        Chat Command
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-ink-muted">
                                    <Users className="w-3 h-3" />
                                    <span className="text-[9px] font-bold uppercase">{messages.length > 0 ? `${new Set(messages.map(m => m.pubkey)).size} Online` : 'Scanning...'}</span>
                                </div>
                            </div>

                            {/* Channel Selector */}
                            <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                                {CHANNELS.map(channel => {
                                    const isActive = activeChannel === channel.id;
                                    return (
                                        <button
                                            key={channel.id}
                                            onClick={() => setActiveChannel(channel.id)}
                                            aria-label={`Switch to ${channel.label} channel (${channel.desc})`}
                                            aria-pressed={isActive}
                                            className={`
                                                flex items-center gap-1.5 px-4 py-2.5 min-h-[40px] rounded-lg border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all
                                                ${isActive
                                                    ? 'bg-ink text-bg border-ink shadow-sm'
                                                    : 'bg-surface text-ink-muted border-border hover:border-ink/50'}
                                            `}
                                        >
                                            <channel.icon className="w-3 h-3" />
                                            {channel.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Messages Area */}
                        {/* Messages Area */}
                        <div className="h-[420px] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent bg-bg/50">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-40 space-y-3">
                                    <Radio className="w-10 h-10 text-ink animate-pulse" />
                                    <p className="text-[10px] uppercase font-black tracking-[0.3em] text-ink-muted text-center">
                                        Chat is quiet<br />No new messages
                                    </p>
                                </div>
                            )}
                            {messages.map((message) => {
                                const isOwn = identity && message.pubkey === identity.publicKey;
                                const isSending = message.status === 'sending';
                                const isFailed = message.status === 'failed';

                                return (
                                    <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-1 duration-300`}>
                                        <div className={`max-w-[85%] space-y-1 ${isOwn ? "text-right" : "text-left"}`}>
                                            <div className={`px-4 py-3 rounded-xl ${isOwn
                                                ? "bg-ink text-bg border border-ink/50"
                                                : "bg-surface text-ink border border-border"
                                                } ${isSending ? "opacity-50" : ""} ${isFailed ? "border-red-400 opacity-60" : ""}`}>
                                                <p className={`text-[8px] font-black uppercase tracking-widest mb-1.5 ${isOwn ? 'text-bg/70' : 'text-ink-muted'
                                                    } ${message.bonus === 'aura' ? '' : ''}`}>
                                                    {profiles[message.pubkey] || getShortId(message.pubkey)}
                                                    {message.streak !== undefined && (
                                                        <span className="ml-1.5 text-[7px] text-orange-400">
                                                            • {message.streak}D 🔥
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm font-medium leading-relaxed break-words">{message.content}</p>
                                            </div>
                                            <div className={`flex items-center gap-2 ${isOwn ? "justify-end" : "justify-start"} px-1`}>
                                                {isSending ? (
                                                    <div className="flex items-center gap-1 text-ink-muted">
                                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                                        <span className="text-[8px] uppercase font-black tracking-tight">Sending...</span>
                                                    </div>
                                                ) : isFailed ? (
                                                    <button
                                                        onClick={() => handleRetry(message)}
                                                        className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                                    >
                                                        <AlertCircle className="w-2.5 h-2.5" />
                                                        <span className="text-[8px] uppercase font-black tracking-tight">Failed</span>
                                                        <RefreshCw className="w-2.5 h-2.5 ml-1" />
                                                        <span className="text-[8px] uppercase font-black tracking-tight">Retry</span>
                                                    </button>
                                                ) : (
                                                    <p className="text-[8px] uppercase font-bold tracking-tight text-ink-muted/60">
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

                        {/* Input Area */}
                        <div className="p-4 border-t border-border bg-gradient-to-r from-secondary/50 to-background/50">
                            <form onSubmit={handleSend} className="flex gap-3">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="TYPE A MESSAGE..."
                                    className="flex-1 bg-surface border-border rounded-xl h-12 text-ink text-xs font-bold uppercase tracking-wider px-4 focus-visible:ring-primary/50 focus-visible:ring-1 focus-visible:border-ink placeholder:text-ink-muted/50"
                                />
                                <Button
                                    type="submit"
                                    disabled={!newMessage.trim() || !identity}
                                    aria-label="Send message"
                                    className="bg-ink hover:bg-ink/90 text-bg font-black rounded-xl h-12 w-12 flex items-center justify-center p-0 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                                >
                                    <Send className="w-5 h-5" aria-hidden="true" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>

                <footer className="mt-8 text-center">
                    <p className="font-black uppercase tracking-[0.4em] text-[8px] text-ink-muted/30">Community Chat // Stay strong. ⚔️</p>
                </footer>
            </div>

            <BottomNav />
        </div>
    );
}
