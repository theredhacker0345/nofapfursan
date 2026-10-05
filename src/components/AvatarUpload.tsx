import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar } from "@/components/Avatar";
import { luxuryClickVibrate } from "@/lib/vibrationUtils";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentAvatar: string;
  onUploadSuccess: (url: string) => void;
  /** Storage key for the local avatar. Pass the pubkey to keep it per-identity. */
  storageKey?: string;
}

const MAX_EDGE = 256;
const MAX_BYTES = 220 * 1024; // comfortably inside the localStorage budget

/**
 * Images never leave the device.
 *
 * The previous implementation uploaded to `nostr.build` and, on any non-OK
 * response, silently fell back to `void.cat` — a public anonymous file host —
 * and then published the resulting URL into the user's public Nostr profile.
 * That is incompatible with a product whose entire pitch is "your data stays
 * yours". Images are now downscaled and stored as a local data URL.
 */
const downscale = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

export function AvatarUpload({
  currentAvatar,
  onUploadSuccess,
  storageKey = "fursan_avatar",
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const src = localPreview ?? (currentAvatar || null);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("That file is not an image");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error("Image is too large");
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await downscale(file);
      if (dataUrl.length > MAX_BYTES) {
        toast.error("Image is too detailed to store locally");
        return;
      }
      localStorage.setItem(storageKey, dataUrl);
      setLocalPreview(dataUrl);
      onUploadSuccess(dataUrl);
      void luxuryClickVibrate();
      toast.success("Avatar updated — stored on this device only");
    } catch (error) {
      console.error("[Avatar] Processing failed", error);
      toast.error("Could not read that image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Change avatar"
        className={cn(
          "group relative inline-flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2",
          "transition-colors hover:border-ink-faint",
        )}
      >
        <Avatar src={src} alt="" size={72} className="border-0" />
        <span className="absolute inset-0 flex items-center justify-center bg-bg/70 text-ink opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-focus-visible:opacity-100">
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
      </button>
      {/* Triggered by the button above; kept out of the accessibility tree so
          the button remains the single named control for this action. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}