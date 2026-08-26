// TODO: Re-implement this with Nostr. One approach is to have users publish a
// custom ephemeral event to a specific tag for the room to signal presence.

interface OnlineUsersProps {
  roomId: string;
  currentUserId: string | null;
  currentUsername: string | null;
  currentAvatarEmoji: string | null;
}

export function OnlineUsers(_props: OnlineUsersProps) {
  // Completely disabled for now
  return null;
}
