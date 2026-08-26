import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { saveJournalEntry, fetchJournalEntries, JournalEntry } from "@/services/nostr";
import { Loader2, Plus, PenLine, Battery, Smile, Scroll, Swords, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { logActivity } from "@/lib/activityLog";

export default function Journal() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState("");
    const [mood, setMood] = useState([5]);
    const [energy, setEnergy] = useState([5]);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        try {
            setLoading(true);
            const data = await fetchJournalEntries();
            setEntries(data || []);
        } catch (e) {
            console.error("Failed to load journal", e);
            toast.error("Relay connection timed out.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!content.trim()) {
            toast.error("Entry content required.");
            return;
        }

        setSaving(true);
        const entry: JournalEntry = {
            content,
            mood: mood[0],
            energy: energy[0],
            timestamp: Date.now(),
        };

        const success = await saveJournalEntry(entry);
        if (success) {
            toast.success("Log Encrypted & Archived! 📜");
            logActivity('journal_save', `Journal entry saved (Mood: ${mood[0]}/10, Energy: ${energy[0]}/10)`);
            setContent("");
            setMood([5]);
            setEnergy([5]);
            setShowForm(false);
            setEntries([entry, ...entries]);
        } else {
            toast.error("Transmission Failure.");
        }
        setSaving(false);
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-4xl mx-auto px-4 pb-24">
                <Header />

                <div className="flex items-center justify-between mb-8 page-transition" style={{ animationDelay: "0.1s" }}>
                    <div>
                        <h1 className="text-3xl font-display text-foreground tracking-tight">My Journal</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Your Private Notes</p>
                    </div>
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        className={`rounded-xl px-6 font-black uppercase text-[10px] tracking-widest h-12 transition-all shadow-lg ${showForm
                            ? "bg-destructive text-white hover:bg-destructive shadow-sm"
                            : "bg-primary text-white shadow-sm"
                            }`}
                    >
                        {showForm ? <><X className="w-4 h-4 mr-2" /> DISCARD</> : <><Plus className="w-4 h-4 mr-2" /> NEW LOG</>}
                    </Button>
                </div>

                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                            animate={{ opacity: 1, height: "auto", scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                            className="overflow-hidden mb-8"
                        >
                            <div className="royal-card p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <Label className="flex justify-between items-center text-[11px] uppercase font-black tracking-widest text-foreground">
                                            <span>Mood Matrix</span>
                                            <span className="text-primary">{mood[0]}/10</span>
                                        </Label>
                                        <div className="px-2">
                                            <Slider value={mood} onValueChange={setMood} min={1} max={10} step={1} className="py-2" />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground font-bold px-1">
                                            <span>STORM</span>
                                            <span>CALM</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="flex justify-between items-center text-[11px] uppercase font-black tracking-widest text-foreground">
                                            <span>Energy Core</span>
                                            <span className="text-primary">{energy[0]}/10</span>
                                        </Label>
                                        <div className="px-2">
                                            <Slider value={energy} onValueChange={setEnergy} min={1} max={10} step={1} className="py-2" />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground font-bold px-1">
                                            <span>DEPLETED</span>
                                            <span>RADIANT</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[11px] uppercase font-black tracking-widest text-foreground">Cognitive Reflection</Label>
                                    <Textarea
                                        placeholder="Document your battle today..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="min-h-[200px] bg-secondary/40 border-border rounded-xl font-sans text-base focus-visible:ring-primary placeholder:text-muted-foreground transition-all"
                                    />
                                </div>

                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full h-16 bg-primary text-white rounded-xl uppercase text-sm font-black tracking-widest shadow-xl shadow-sm transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <PenLine className="w-5 h-5 mr-3" />}
                                    {saving ? "ENCRYPTING SIGNAL..." : "ARCHIVE LOG"}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white/30 rounded-3xl border-2 border-dashed border-border">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-150 animate-pulse" />
                                <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" strokeWidth={3} />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Fetching Encrypted Records</p>
                        </div>
                    ) : entries?.length === 0 ? (
                        <div className="text-center py-24 rounded-3xl border-2 border-dashed border-border bg-white/20">
                            <Scroll className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">The Archives are Silent</p>
                            <p className="text-sm font-medium text-foreground/40 mt-1">Start documenting your path to legend.</p>
                        </div>
                    ) : (
                        entries?.map((entry, i) => (
                            <motion.div
                                key={entry.id || i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="royal-card p-8 space-y-6 group hover:border-primary/40 transition-all"
                            >
                                {(() => {
                                    let dateStr = "Archive Date Unknown";
                                    try {
                                        dateStr = format(entry.timestamp, "MMMM d, yyyy • h:mm a");
                                    } catch (e) {
                                        console.warn("Invalid timestamp for entry:", entry.id);
                                    }
                                    return (
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest border-b border-border pb-4">
                                            <span className="text-foreground/40">{dateStr}</span>
                                            <div className="flex gap-6">
                                                <span className="flex items-center gap-2 text-muted-foreground">
                                                    <Smile className="w-4 h-4 opacity-50" />
                                                    <span className="text-foreground">{entry.mood}</span>
                                                </span>
                                                <span className="flex items-center gap-2 text-muted-foreground">
                                                    <Battery className="w-4 h-4 opacity-50" />
                                                    <span className="text-foreground">{entry.energy}</span>
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}
                                <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground font-medium">
                                    {entry.content}
                                </p>
                                <div className="pt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Swords className="w-4 h-4 text-muted-foreground/50" />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

            </div>
            <BottomNav />
        </div>
    );
}
