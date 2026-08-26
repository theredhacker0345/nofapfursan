import React, { useState } from 'react';
import { finalizeEvent } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';
import { Save, RefreshCw, Download, ShieldCheck, Sparkles } from 'lucide-react';
import { RELAYS } from '@/services/nostr';
import { SimplePool } from 'nostr-tools';
import { toast } from 'sonner';

interface IdentityManagementProps {
    userPrivateKey: string;
    pool: SimplePool;
    initialAlias?: string;
    onUpdateSuccess?: (newName: string) => void;
    onSync?: () => void;
    onFetch?: () => void;
}

export const IdentityManagement = ({
    userPrivateKey,
    pool,
    initialAlias = "FURSAN_KNIGHT",
    onUpdateSuccess,
    onSync,
    onFetch
}: IdentityManagementProps) => {
    const [alias, setAlias] = useState(initialAlias);
    const [isUpdating, setIsUpdating] = useState(false);

    const updateMetadata = async () => {
        if (!alias.trim()) return;
        setIsUpdating(true);

        try {
            const eventTemplate = {
                kind: 0,
                created_at: Math.floor(Date.now() / 1000),
                tags: [],
                content: JSON.stringify({
                    name: alias.trim(),
                    display_name: alias.trim(),
                    about: "Fursan member | Staying disciplined ⚔️",
                }),
            };

            const sk = hexToBytes(userPrivateKey);
            const signedEvent = finalizeEvent(eventTemplate, sk);

            await Promise.all(
                RELAYS.map(url => pool.publish([url], signedEvent))
            );

            console.log("[FURSAN] Metadata Broadcasted:", alias);
            toast.success(`Identity Updated: ${alias}`);
            if (onUpdateSuccess) onUpdateSuccess(alias.trim());
        } catch (err) {
            console.error("[FURSAN] Metadata Failure:", err);
            toast.error("Failed to update metadata. Check relay connections.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Alias Input Section */}
            <div className="space-y-3">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-ink">
                    Display Name
                </label>
                <div className="relative group">
                    <input
                        type="text"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        className="w-full bg-surface-2/40 border-2 border-border p-4 rounded-xl font-display text-xl uppercase tracking-widest text-ink outline-none focus:border-ink focus:bg-white transition-all shadow-sm"
                        placeholder="ENTER_ALIAS..."
                    />
                    <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted group-focus-within:text-ink transition-colors" />
                </div>
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest px-1">
                    Your public identifier on the Nostr network.
                </p>
            </div>

            {/* Main Action Button */}
            <button
                onClick={updateMetadata}
                disabled={isUpdating}
                className={`w-full flex items-center justify-center gap-3 h-16 rounded-xl font-black uppercase text-sm tracking-widest transition-all shadow-lg active:scale-95
                   ${isUpdating
                        ? 'bg-surface-2 text-ink cursor-not-allowed'
                        : 'bg-ink text-white shadow-sm hover:shadow-xl hover:scale-[1.01]'}`}
            >
                {isUpdating ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                {isUpdating ? "BROADCASTING..." : "UPDATE IDENTITY"}
            </button>

            {/* Sync/Fetch Sub-grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={onSync}
                    className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-border bg-white text-ink font-bold text-[10px] uppercase tracking-widest hover:bg-surface-2 transition-all active:scale-95 shadow-sm"
                >
                    <RefreshCw size={14} className="text-ink" /> SYNC PROGRESS
                </button>
                <button
                    onClick={onFetch}
                    className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-border bg-white text-ink font-bold text-[10px] uppercase tracking-widest hover:bg-surface-2 transition-all active:scale-95 shadow-sm"
                >
                    <Download size={14} className="text-ink" /> FETCH CLOUD
                </button>
            </div>

            {/* Secure Footer */}
            <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-ink/30">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" />
                        <span>NIP-01 VERIFIED</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
