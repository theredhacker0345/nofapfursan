import { motion } from "framer-motion";
import { FursanLogo } from "@/components/FursanLogo";
import { Sparkles } from "lucide-react";

interface LoadingScreenProps {
    message?: string;
    subMessage?: string;
}

export function LoadingScreen({
    message = "Loading...",
    subMessage = "Getting things ready"
}: LoadingScreenProps) {
    return (
        <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 space-y-8 overflow-hidden">
            <div className="relative">
                {/* Glowing outer aura */}
                <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-3xl animate-pulse scale-150" />

                {/* Animated Islamic Geometric Pattern hints */}
                <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="w-40 h-40 border-2 border-dashed border-amber-300/40 rounded-full flex items-center justify-center p-1"
                >
                    <div className="absolute inset-4 border border-amber-200/50 rounded-full" />
                </motion.div>

                {/* The Logo */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <div className="bg-white p-6 rounded-full shadow-2xl shadow-amber-500/20 border-2 border-amber-100">
                        <FursanLogo className="w-16 h-16 fursan-logo-glow" />
                    </div>
                </motion.div>

                {/* Subtle expanding rings */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 1, opacity: 0.4 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
                        className="absolute inset-0 border border-amber-400/30 rounded-full"
                    />
                ))}
            </div>

            <div className="text-center space-y-4 relative z-10">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <h2 className="text-amber-900 text-3xl font-display tracking-widest">{message}</h2>
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                </div>

                <div className="flex flex-col items-center gap-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-amber-800/40">{subMessage}</p>
                    <p className="text-xs font-medium text-amber-900/60 italic">Discipline over desire.</p>

                    {/* Royal progress bar */}
                    <div className="w-56 h-1.5 bg-amber-100 rounded-full overflow-hidden border border-amber-200/50">
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Background design accents */}
            <div className="fixed top-0 left-0 w-64 h-64 bg-amber-400/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="fixed bottom-0 right-0 w-64 h-64 bg-emerald-400/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
    );
}
