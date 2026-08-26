import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Key, User, ArrowLeft, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { importKey, generateOrLoadKeys } from "@/services/nostr";
import { FursanLogo } from "@/components/FursanLogo";

interface NIP07Extension {
  getPublicKey: () => Promise<string>;
}

const Auth = () => {
  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await generateOrLoadKeys();
      toast.success("Identity Created", {
        description: "New keys generated and stored in local vault."
      });
      navigate("/");
    } catch (error) {
      toast.error("Initialization Failed");
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (!privateKey.startsWith("nsec")) {
        toast.error("Invalid Format", {
          description: "Keys must begin with 'nsec' prefix."
        });
        setLoading(false);
        return;
      }

      const success = await importKey(privateKey);
      if (success) {
        toast.success("Identity Merged", {
          description: "Secure protocol established."
        });
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      toast.error("Authentication Error", {
        description: "Verify private key integrity."
      });
    }
    setLoading(false);
  };

  const handleExtensionLogin = async () => {
    const nostrExtension = (window as { nostr?: NIP07Extension }).nostr;
    if (!nostrExtension) {
      toast.error("Extension Not Found", {
        description: "Please install Alby, Nos2X, or similar."
      });
      return;
    }

    setLoading(true);
    try {
      // Verify the extension is reachable. Fursan signs events locally with its
      // own keys, so extension login only confirms the extension is present.
      await nostrExtension.getPublicKey();
      toast.info("Extension Detected", {
        description: "Fursan signs with its own vault keys — use an nsec or generate a new ID to continue."
      });
    } catch (e) {
      toast.error("Extension Access Denied");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-700">
        <Button
          variant="ghost"
          className="mb-8 rounded-xl border-amber-200 text-amber-800 hover:bg-amber-100/50 uppercase text-[10px] font-black tracking-widest shadow-sm"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Abort Protocol
        </Button>

        <div className="royal-card p-10 md:p-12 space-y-10">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full scale-150 animate-pulse" />
              <FursanLogo className="w-20 h-20 fursan-logo-glow relative z-10" />
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-display tracking-tight text-amber-900">Knight Sync</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600/40 mt-1">Identity Encryption Protocol</p>
              <p className="text-xs font-medium text-amber-700/60 italic mt-2">"Discipline over desire."</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="privateKey" className="text-[11px] font-black uppercase tracking-widest text-amber-800">Credential Input (nsec)</Label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 group-focus-within:text-amber-600 transition-colors" />
                <Input
                  id="privateKey"
                  type="password"
                  placeholder="NSEC_PROTOCOL_KEY..."
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="pl-12 h-14 rounded-xl border-amber-100 border-2 bg-amber-50/30 focus-visible:ring-amber-400 font-mono text-xs text-amber-900 placeholder:text-amber-200"
                />
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={loading || !privateKey}
              className="w-full h-16 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl uppercase text-xs font-black tracking-widest shadow-xl shadow-amber-500/20 hover:scale-[1.01] active:scale-95 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <ShieldCheck className="w-5 h-5 mr-3" />}
              Initialize Link
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-amber-100"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-[#FAF6F0] px-4 text-amber-600/30">Alternative Portals</span></div>
          </div>

          <div className="grid gap-4">
            <Button
              onClick={handleExtensionLogin}
              disabled={loading}
              variant="outline"
              className="w-full h-14 rounded-xl border-amber-200 bg-white text-amber-800 font-bold uppercase text-[11px] tracking-widest hover:bg-amber-50 transition-all shadow-sm"
            >
              <User className="w-4 h-4 mr-2 text-amber-500" />
              Nostr Extension (NIP-07)
            </Button>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              variant="outline"
              className="w-full h-14 rounded-xl border-amber-200 bg-white text-amber-800 font-bold uppercase text-[11px] tracking-widest hover:bg-amber-50 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
              Generate Random ID
            </Button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-bold text-amber-800/20 uppercase tracking-[0.4em]">Fursan Persistence Engine v2.5.0</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
