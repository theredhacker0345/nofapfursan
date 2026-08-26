import { useState, useEffect } from "react";
// import { supabase } from "@/integrations/supabase/client";

// TODO: Re-implement this with Nostr events (e.g., a custom ephemeral event for typing)

interface TypingUser {
  username: string;
  avatar_emoji: string;
}

interface TypingIndicatorProps {
  roomId: string;
  currentUserId: string | null;
}

export function TypingIndicator({ roomId, currentUserId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    // if (!currentUserId) return;
    // const channel = supabase.channel(`typing-${roomId}`);
    // channel
    //   .on("presence", { event: "sync" }, () => {
    //     const state = channel.presenceState();
    //     const users: TypingUser[] = [];
    //     Object.values(state).forEach((presences: any) => {
    //       presences.forEach((presence: any) => {
    //         if (presence.user_id !== currentUserId && presence.isTyping) {
    //           users.push({
    //             username: presence.username || "Someone",
    //             avatar_emoji: presence.avatar_emoji || "🌱",
    //           });
    //         }
    //       });
    //     });
    //     setTypingUsers(users);
    //   })
    //   .subscribe();
    // return () => {
    //   supabase.removeChannel(channel);
    // };
  }, [roomId, currentUserId]);

  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing`;
    } else {
      return `${typingUsers.length} people are typing`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm text-ink-muted animate-pulse">
      <div className="flex -space-x-1">
        {typingUsers.slice(0, 3).map((user, i) => (
          <span
            key={i}
            className="w-5 h-5 rounded-full bg-surface-2 flex items-center justify-center text-xs border border-background"
          >
            {user.avatar_emoji}
          </span>
        ))}
      </div>
      <span>{getTypingText()}</span>
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-surface-2 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-surface-2 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-surface-2 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </span>
    </div>
  );
}

export function useTypingIndicator(roomId: string, userId: string | null, username: string | null, avatarEmoji: string | null) {
  // const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // if (!userId) return;
    // const ch = supabase.channel(`typing-${roomId}`);
    // ch.subscribe(async (status) => {
    //   if (status === "SUBSCRIBED") {
    //     await ch.track({
    //       user_id: userId,
    //       username: username || "Anonymous",
    //       avatar_emoji: avatarEmoji || "🌱",
    //       isTyping: false,
    //     });
    //   }
    // });
    // setChannel(ch);
    // return () => {
    //   supabase.removeChannel(ch);
    // };
  }, [roomId, userId, username, avatarEmoji]);

  const setTyping = async (isTyping: boolean) => {
    // if (!channel || !userId) return;
    // await channel.track({
    //   user_id: userId,
    //   username: username || "Anonymous",
    //   avatar_emoji: avatarEmoji || "🌱",
    //   isTyping,
    // });
  };

  return { setTyping };
}
