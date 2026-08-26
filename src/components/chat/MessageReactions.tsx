// TODO: Re-implement this with Nostr kind 7 events

interface MessageReactionsProps {
  messageId: string;
  userId: string | null;
}

export function MessageReactions({ messageId: _messageId, userId: _userId }: MessageReactionsProps) {
  // Completely disabled for now
  return null;
}
