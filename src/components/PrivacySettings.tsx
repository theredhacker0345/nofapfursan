import { ShieldCheck, LockKeyhole } from "lucide-react";

import { RelaySettings } from "@/components/RelaySettings";

/**
 * Privacy panel.
 *
 * The copy is now accurate: records live on this device, and the encrypted copy
 * on relays is readable only with the user's own key. The previous text claimed
 * storage was "encrypted on this device only", which was never true — the
 * WebView store is plaintext and the streak is also published to relays.
 */
export function PrivacySettings() {
  return (
    <div>
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="text-body-s font-semibold text-ink">Your records stay yours</h3>
            <p className="text-body-s text-ink-muted">
              Your streak, check-ins and journal are written to this device first and
              never leave it unless you are online. The copy sent to relays is
              encrypted with NIP-44 and readable only by your key — nobody, including
              us, holds that key.
            </p>
            <p className="inline-flex items-center gap-1.5 text-meta text-ink-faint">
              <LockKeyhole className="h-3 w-3" aria-hidden="true" />
              There is no account, no email, and no server to hand data to.
            </p>
          </div>
        </div>
      </div>

      <RelaySettings />
    </div>
  );
}