import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ChatRoomList } from "@/components/chat/ChatRoomList";
import { Leaderboard } from "@/components/Leaderboard";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { ChatRules } from "@/components/chat/ChatRules";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, User as UserIcon, Loader2, Network, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { generateOrLoadKeys, clearKeys, NostrKeys } from "@/services/nostr";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useNostr } from "@/hooks/useNostr";
import { LoadingScreen } from "@/components/LoadingScreen";

const Community = () => {
  const { connectedRelays } = useNostr();
  const [identity, setIdentity] = useState<NostrKeys | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>("global");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    generateOrLoadKeys().then(id => {
      if (id?.privateKey) {
        setIdentity(id);
      }
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    try {
      await clearKeys();
      setIdentity(null);
      toast.success("Identity Purged", {
        description: "Local cryptovault has been cleared."
      });
      navigate("/");
    } catch (e) {
      toast.error("Logout failed.");
    }
  };

  if (loading) {
    return <LoadingScreen message="Linking Fursan Relays" subMessage="Establishing P2P Bridge" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary>
        <div className="container max-w-6xl mx-auto px-4 pb-24">
          <Header />

          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 page-transition" style={{ animationDelay: "0.1s" }}>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="rounded-xl border-amber-200 bg-white text-amber-800 hover:bg-amber-50 uppercase text-[10px] font-black tracking-widest px-6 h-12 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Tracker
            </Button>

            {identity ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/profile")}
                  className="rounded-xl border-amber-200 bg-white text-amber-800 hover:bg-amber-50 uppercase text-[10px] font-black tracking-widest px-6 h-12 shadow-sm"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  My Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="rounded-xl border-rose-100 bg-white text-rose-500 hover:bg-rose-50 hover:border-rose-200 uppercase text-[10px] font-black tracking-widest px-6 h-12 shadow-sm transition-all"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Purge Identity
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:shadow-xl rounded-xl uppercase text-[10px] font-black tracking-widest px-8 h-12 shadow-lg shadow-amber-500/20"
              >
                Authenticate to Enter Circle
              </Button>
            )}
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-1 space-y-6">
              <ChatRoomList
                selectedRoom={selectedRoom}
                onSelectRoom={setSelectedRoom}
              />
              <Leaderboard />
            </div>
            <div className="md:col-span-3 space-y-6">
              <ChatRules />
              {selectedRoom ? (
                <ChatRoom key={selectedRoom} roomId={selectedRoom} />
              ) : (
                <div className="royal-card h-96 flex flex-col items-center justify-center bg-white/50 border-dashed">
                  <Network className="w-12 h-12 text-amber-200 mb-4 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-800/20 text-center">
                    SELECT A FREQUENCY TO<br />RECEIVE BROTHERHOOD SIGNALS
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ErrorBoundary>

      {/* Connection Toast-like floating indicator */}
      <div className="fixed bottom-24 left-0 right-0 px-4 pointer-events-none z-50">
        <div className="max-w-6xl mx-auto flex justify-end">
          <div className="bg-white/80 backdrop-blur-md rounded-full px-5 py-2 flex items-center gap-3 text-[10px] font-black tracking-[0.1em] uppercase border border-amber-200 shadow-xl shadow-amber-900/5 pointer-events-auto">
            <div className={`w-2 h-2 rounded-full ${connectedRelays.length > 0 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-rose-500 animate-ping'}`} />
            <span className="text-amber-900">{connectedRelays.length > 0 ? `${connectedRelays.length} Relays Connected` : 'Searching for Relays...'}</span>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Community;
