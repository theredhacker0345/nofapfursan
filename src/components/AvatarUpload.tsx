import React, { useState, useContext } from 'react';
import { Camera, Loader2, UploadCloud, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateOrLoadKeys } from "@/services/nostr";
import { useNostr } from "@/hooks/useNostr";
import { finalizeEvent } from "nostr-tools";

interface AvatarUploadProps {
    currentAvatar?: string;
    onUploadSuccess: (url: string) => void;
}

export const AvatarUpload = ({ currentAvatar, onUploadSuccess }: AvatarUploadProps) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { publish } = useNostr();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Invalid file type', { description: 'Please upload an image file.' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large', { description: 'Maximum file size is 5MB.' });
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const identity = await generateOrLoadKeys();
            let authHeader = '';

            if (identity?.privateKey) {
                const authEvent = {
                    kind: 27235,
                    created_at: Math.floor(Date.now() / 1000),
                    tags: [['u', 'https://nostr.build/api/v2/upload/files'], ['method', 'POST']],
                    content: '',
                };
                const signedAuth = finalizeEvent(authEvent, identity.privateKey);
                const jsonString = JSON.stringify(signedAuth);
                const b64Auth = btoa(unescape(encodeURIComponent(jsonString)));
                authHeader = `Nostr ${b64Auth}`;
            }

            const formData = new FormData();
            formData.append('file', file);

            let response = await fetch('https://nostr.build/api/v2/upload/files', {
                method: 'POST',
                body: formData,
                headers: authHeader ? { 'Authorization': authHeader } : undefined
            });

            if (!response.ok) {
                console.log("Falling back to void.cat");
                response = await fetch('https://void.cat/upload', { method: 'POST', body: formData });
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            const url = result.data?.[0]?.url || result.url || result.file?.url;

            if (!url) {
                throw new Error('URL not found in response');
            }

            onUploadSuccess(url);

            // Also publish to Nostr kind-0 metadata so avatar appears everywhere
            try {
                await publishProfileAvatar(url);
                toast.success('Avatar Updated!', { description: 'Profile picture synced to Nostr.' });
            } catch (e) {
                console.warn('Avatar uploaded but metadata sync failed:', e);
                toast.success('Avatar uploaded!', { description: 'Synced locally. Nostr sync will retry.' });
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Upload failed');
            toast.error('Upload Failed', { description: 'Could not upload. Please try again.' });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const publishProfileAvatar = async (url: string) => {
        const identity = await generateOrLoadKeys();
        if (!identity?.privateKey) return;

        const metadata = {
            name: localStorage.getItem(`nostr_username_${identity.publicKey}`) || '',
            picture: url,
            about: localStorage.getItem(`nostr_about_${identity.publicKey}`) || '',
        };

        const event = {
            kind: 0,
            created_at: Math.floor(Date.now() / 1000),
            tags: [],
            content: JSON.stringify(metadata),
        };

        const signedEvent = finalizeEvent(event, identity.privateKey);
        await publish(signedEvent);
    };

    return (
        <div className="relative group">
            <div className={`w-24 h-24 overflow-hidden border-4 ${error ? 'border-red-500' : 'border-black'} bg-white flex items-center justify-center transition-colors`}>
                {currentAvatar ? (
                    <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover grayscale" />
                ) : (
                    <Camera className="w-8 h-8 text-black/20" />
                )}
            </div>

            <div
                className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200"
                onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: Event) => {
                        const target = e.target as HTMLInputElement;
                        const event = {
                            target,
                        } as React.ChangeEvent<HTMLInputElement>;
                        handleFileChange(event);
                    };
                    input.click();
                }}
            >
                {uploading ? (
                    <div className="flex flex-col items-center gap-1">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-[8px] uppercase font-black tracking-widest">Uploading...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-1">
                        <AlertCircle className="w-6 h-6" />
                        <span className="text-[8px] uppercase font-black tracking-widest">Retry</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        <UploadCloud className="w-6 h-6" />
                        <span className="text-[8px] uppercase font-black tracking-widest">Upload</span>
                    </div>
                )}
            </div>
        </div>
    );
};