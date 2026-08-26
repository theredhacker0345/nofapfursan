import React, { useState } from 'react';
import { useNostrContext } from '@/context/NostrContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wifi, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const RelaySettings = () => {
    const { relays, connectedRelays, relayMetadata, addRelay, removeRelay, checkRelayStatus } = useNostrContext();
    const [newRelay, setNewRelay] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = newRelay.trim();
        if (!url) return;

        if (!url.startsWith('wss://') && !url.startsWith('ws://')) {
            setError('Invalid protocol. Use wss://');
            return;
        }

        setVerifying(true);
        setError(null);

        try {
            const { success, metadata } = await checkRelayStatus(url);

            if (success) {
                await addRelay(url);
                setNewRelay('');
                toast.success(`Relay Added: ${metadata?.name || url}`);
            } else {
                setError('Could not connect to this relay');
                toast.error('Connection failed');
            }
        } catch (err) {
            setError('Verification failed');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Wifi className="w-4 h-4" /> Relay Network
                </h3>
                <span className="text-[10px] font-bold uppercase text-black bg-white border border-black px-2 py-0.5">
                    {connectedRelays.length} ACTIVE
                </span>
            </div>

            <div className="space-y-2">
                <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Input
                            value={newRelay}
                            onChange={(e) => {
                                setNewRelay(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="WSS://RELAY.DAMUS.IO"
                            className={`border-black rounded-none h-12 text-xs font-mono bg-white focus-visible:ring-0 focus-visible:ring-offset-0 ${error ? 'border-red-500' : ''}`}
                            disabled={verifying}
                        />
                        {verifying && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-black" />
                            </div>
                        )}
                    </div>
                    <Button
                        type="submit"
                        variant="outline"
                        className="border-black rounded-none h-12 px-6 bg-black text-white hover:bg-black/90 uppercase text-[10px] font-bold tracking-widest sm:w-auto w-full"
                        disabled={verifying || !newRelay.trim()}
                    >
                        {verifying ? 'TESTING...' : <><Plus className="w-4 h-4 mr-2" /> ADD RELAY</>}
                    </Button>
                </form>
                {error && (
                    <div className="flex items-center gap-2 text-danger text-[10px] font-bold uppercase tracking-tighter animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                    </div>
                )}
            </div>

            <div className="border-t border-black/10 pt-4 space-y-2">
                {relays.map((url) => {
                    const isConnected = connectedRelays.includes(url);
                    const metadata = relayMetadata[url];
                    const displayName = metadata?.name || url.split('//')[1].split('/')[0];

                    return (
                        <div key={url} className="flex items-center justify-between p-4 border border-black bg-white group hover:bg-surface-2/5 transition-colors">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-danger/50 shadow-[0_0_6px_rgba(239,68,68,0.3)]'}`} />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold uppercase truncate tracking-tighter">
                                        {displayName}
                                    </span>
                                    <span className="text-[9px] font-mono text-ink-muted truncate opacity-50 group-hover:opacity-80">
                                        {url.toLowerCase()}
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Remove relay ${url}`}
                                onClick={() => removeRelay(url)}
                                className="text-black hover:bg-black hover:text-white rounded-none h-10 w-10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
