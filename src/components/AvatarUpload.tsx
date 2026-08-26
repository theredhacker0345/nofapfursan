import React, { useState } from 'react';
import { Camera, Loader2, UploadCloud, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateOrLoadKeys } from "@/services/nostr";
import { finalizeEvent } from "nostr-tools";

interface AvatarUploadProps {
    currentAvatar?: string;
    onUploadSuccess: (url: string) => void;
}

export const AvatarUpload = ({ currentAvatar, onUploadSuccess }: AvatarUploadProps) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Invalid file type', { description: 'Please upload an image file.' });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large', { description: 'Maximum file size is 5MB.' });
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // 1. Get identity for NIP-98
            const identity = await generateOrLoadKeys();
            let authHeader = '';
            const uploadUrl = 'https://nostr.build/api/v2/upload/files';

            if (identity?.privateKey) {
                const authEvent = {
                    kind: 27235, // HTTP Auth
                    created_at: Math.floor(Date.now() / 1000),
                    tags: [
                        ['u', uploadUrl],
                        ['method', 'POST']
                    ],
                    content: '',
                };
                const signedAuth = finalizeEvent(authEvent, identity.privateKey);
                // Robust base64 encoding for NIP-98
                const jsonString = JSON.stringify(signedAuth);
                const b64Auth = btoa(unescape(encodeURIComponent(jsonString)));
                authHeader = `Nostr ${b64Auth}`;
            }

            // Create FormData
            const formData = new FormData();
            formData.append('file', file);

            // 2. Try nostr.build with Auth
            let response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
                headers: authHeader ? { 'Authorization': authHeader } : undefined
            });

            // 3. Fallback to void.cat if authorized upload fails or no auth
            if (!response.ok && !authHeader) {
                console.log("Falling back to void.cat (no auth)");
                response = await fetch('https://void.cat/upload', {
                    method: 'POST',
                    body: formData
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();

            // Handle different API responses
            // nostr.build v2: { data: [{ url: "..." }] }
            // void.cat: { file: { url: "..." } } (need to construct URL usually, but let's check standard return)
            // actually void.cat returns basic info. simpler fallback might be 0x0.st or just showing error if nostr.build fails.
            // Let's stick to handling nostr.build correctly first. 

            // Re-parsing nostr.build response safely
            const url = result.data?.[0]?.url || result.url || result.file?.url;

            if (url) {
                onUploadSuccess(url);
                toast.success('Avatar Updated!', { description: 'Profile picture uploaded successfully.' });
            } else {
                console.error('Unexpected response:', result);
                throw new Error('URL not found in response');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Upload failed');
            toast.error('Upload Failed', {
                description: 'Could not upload to nostr.build. Please try again.'
            });
        } finally {
            setUploading(false);
            // Reset input so same file can be re-selected
            e.target.value = '';
        }
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
                {/* File input removed to prevent BFS Cache freeze */}
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
