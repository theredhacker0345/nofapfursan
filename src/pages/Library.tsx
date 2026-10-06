import { useMemo, useState } from "react";
import { Search, BookOpen, FileText, Clock, ArrowLeft } from "lucide-react";

import { Screen, SectionHead } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "pdf" | "article" | "guide";
  author?: string;
  url?: string;
  readTime?: number;
  tags?: string[];
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "guides", label: "Guides" },
  { id: "articles", label: "Articles" },
  { id: "pdfs", label: "PDFs" },
  { id: "recovery", label: "Recovery" },
  { id: "islamic", label: "Islamic" },
  { id: "health", label: "Health" },
] as const;

const CATEGORY_ORDER = ["guides", "articles", "pdfs", "recovery", "islamic", "health"];

const KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: "guide-1",
    title: "Starting Your Streak: The First 7 Days",
    description:
      "A practical guide for the critical first week — morning routines, trigger identification, and how to build momentum.",
    category: "guides",
    type: "guide",
    author: "Fursan",
    readTime: 8,
    tags: ["beginner", "streak", "routine"],
  },
  {
    id: "guide-2",
    title: "Understanding Triggers: The HALT Method",
    description:
      "Recognise Hunger, Anger, Loneliness and Tiredness as the four states that precede a relapse, and what to do in each.",
    category: "guides",
    type: "guide",
    author: "Fursan",
    readTime: 12,
    tags: ["triggers", "psychology"],
  },
  {
    id: "guide-3",
    title: "Managing Urges: The 15-Minute Rule",
    description:
      "An urge is a wave, not a command. Distraction techniques and grounding exercises for the next fifteen minutes.",
    category: "recovery",
    type: "guide",
    author: "Fursan",
    readTime: 5,
    tags: ["urges", "coping"],
  },
  {
    id: "guide-4",
    title: "Rebuilding After a Relapse",
    description:
      "Why a single slip does not erase your streak, and how to restart without shame using the evidence-based lapse-and-relapse model.",
    category: "recovery",
    type: "guide",
    author: "Fursan",
    readTime: 7,
    tags: ["relapse", "shame", "restart"],
    url: "https://www.netpsychology.org/porn-addiction-recovery-30-day",
  },
  {
    id: "guide-5",
    title: "Building a Routine That Lasts",
    description:
      "How to structure your day around anchors that make discipline automatic — sleep, movement, connection and purpose.",
    category: "guides",
    type: "guide",
    author: "Fursan",
    readTime: 9,
    tags: ["routine", "habits", "discipline"],
    url: "https://www.netpsychology.org/porn-addiction-recovery-30-day",
  },
  {
    id: "guide-6",
    title: "Lowering the Gaze in a Digital Age",
    description:
      "Practical boundaries for screens, social media and advertising — how to protect your attention when the entire internet is designed to grab it.",
    category: "islamic",
    type: "guide",
    author: "Fursan",
    readTime: 6,
    tags: ["gaze", "digital", "boundaries"],
    url: "https://www.islamonline.net/en/first-step-to-overcoming-addiction-islamic-guide",
  },
  {
    id: "guide-7",
    title: "Tawakkul and Action: An Islamic Framework for Recovery",
    description:
      "How to balance trust in Allah with practical effort — using the Islamic concepts of tawakkul, sabr and muhaasabah to sustain long-term change.",
    category: "islamic",
    type: "guide",
    author: "Fursan",
    readTime: 10,
    tags: ["tawakkul", "sabr", "framework"],
    url: "https://yaqeeninstitute.org/read/paper/how-to-overcome-addiction-through-faith-ibn-al-qayyims-rehabilitation-program",
  },
  {
    id: "article-1",
    title: "The Neuroscience of Addiction",
    description:
      "What dopamine and the reward pathway actually do, and why willpower alone is not the missing ingredient.",
    category: "articles",
    type: "article",
    author: "Fursan",
    readTime: 15,
    tags: ["neuroscience", "dopamine"],
  },
  {
    id: "article-2",
    title: "Building a Support System That Works",
    description:
      "How to find accountability, use the Vanguard channels, and shape an environment that makes the right thing easier.",
    category: "articles",
    type: "article",
    author: "Fursan",
    readTime: 10,
    tags: ["community", "accountability"],
  },
  {
    id: "article-3",
    title: "Sleep, Stress, and Relapse",
    description:
      "The hidden connection between poor sleep, chronic stress and relapse — plus a sleep hygiene checklist.",
    category: "health",
    type: "article",
    author: "Fursan",
    readTime: 12,
    tags: ["sleep", "stress", "health"],
  },
  {
    id: "article-4",
    title: "CBT and ACT for Problematic Pornography Use",
    description:
      "A 2025 meta-analysis in the Journal of Behavioral Addictions confirms CBT and ACT are the best-evidenced psychotherapies for PPU.",
    category: "articles",
    type: "article",
    author: "López-Pinar et al., J Behav Addict 2025",
    readTime: 14,
    tags: ["cbt", "act", "research", "meta-analysis"],
    url: "https://doi.org/10.1556/2006.2025.00018",
  },
  {
    id: "article-5",
    title: "Treatment Approaches for Problematic Pornography Use: Systematic Review",
    description:
      "Roza et al. (2024) reviewed 28 studies and found CBT-based interventions produce large effect sizes for reducing PPU and sexual compulsivity.",
    category: "articles",
    type: "article",
    author: "Roza et al., Arch Sex Behav 2024",
    readTime: 13,
    tags: ["cbt", "research", "systematic-review"],
    url: "https://doi.org/10.1007/s10508-023-02699-z",
  },
  {
    id: "article-6",
    title: "How to Overcome Porn Addiction in Islam",
    description:
      "A structured fatwa-based guide from About Islam covering repentance (tawbah), taqwa, practical habit-replacement and nightly self-evaluation.",
    category: "islamic",
    type: "article",
    author: "About Islam",
    readTime: 11,
    tags: ["islamic", "tawbah", "practical"],
    url: "https://aboutislam.net/counseling/ask-the-scholar/morals-manners/ways-to-overcome-porn-addiction-as-a-muslim-youth",
  },
  {
    id: "article-7",
    title: "Overcoming Addictions Through Faith: Ibn Al-Qayyim’s Rehabilitation Program",
    description:
      "Yaqeen Institute summarises classical Islamic psychology for addiction — the three stages of the nafs and how taqwa breaks the craving cycle.",
    category: "islamic",
    type: "article",
    author: "Yaqeen Institute",
    readTime: 12,
    tags: ["islamic", "nafs", "taqwa", "yaqeen"],
    url: "https://yaqeeninstitute.org/read/paper/how-to-overcome-addiction-through-faith-ibn-al-qayyims-rehabilitation-program",
  },
  {
    id: "pdf-1",
    title: "The Fursan Recovery Workbook",
    description:
      "A 30-day workbook with daily reflections, a trigger log, gratitude practice and progress tracking.",
    category: "pdfs",
    type: "pdf",
    author: "Fursan",
    readTime: 30,
    tags: ["workbook", "printable"],
    url: "https://www.netpsychology.org/porn-addiction-recovery-30-day",
  },
  {
    id: "pdf-2",
    title: "Islamic Perspective on Recovery",
    description:
      "Quranic verses, hadith and scholarly framing for overcoming addiction from an Islamic standpoint.",
    category: "pdfs",
    type: "pdf",
    author: "Fursan",
    readTime: 20,
    tags: ["islamic", "quran", "hadith"],
    url: "https://yaqeeninstitute.org/read/paper/how-to-overcome-addiction-through-faith-ibn-al-qayyims-rehabilitation-program",
  },
  {
    id: "resource-1",
    title: "SMART Recovery 4-Point Program",
    description:
      "Free, evidence-based mutual-support meetings grounded in CBT and REBT. Covers motivation, urge management, thoughts and lifestyle balance — available online and in-person worldwide.",
    category: "recovery",
    type: "guide",
    author: "SMART Recovery International",
    readTime: 8,
    tags: ["cbt", "meetings", "peer-support"],
    url: "https://smartrecoveryglobal.org/",
  },
  {
    id: "resource-2",
    title: "SMART Recovery Toolbox",
    description:
      "Worksheets and exercises including the ABC Exercise, Cost-Benefit Analysis, Urge Log, and Disputing Unhelpful Beliefs — all free to download.",
    category: "recovery",
    type: "guide",
    author: "SMART Recovery",
    readTime: 10,
    tags: ["tools", "worksheets", "cbt"],
    url: "https://smartrecovery.org/toolbox",
  },
  {
    id: "resource-3",
    title: "Your Brain on Porn",
    description:
      "Gary Wilson’s widely-cited book and website summarising the neuroscience of internet pornography and the reboot movement. Includes the free professionals’ training course.",
    category: "articles",
    type: "article",
    author: "Gary Wilson",
    readTime: 16,
    tags: ["neuroscience", "reboot", "book"],
    url: "https://www.yourbrainonporn.com/",
  },
  {
    id: "resource-4",
    title: "The Willpower Instinct",
    description:
      "Stanford psychologist Kelly McGonigal’s science-based program for strengthening self-control — based on her wildly popular ‘Science of Willpower’ course.",
    category: "articles",
    type: "article",
    author: "Kelly McGonigal, PhD",
    readTime: 14,
    tags: ["willpower", "self-control", "book"],
    url: "http://kellymcgonigal.com/books",
  },
  {
    id: "resource-5",
    title: "Iman Cave: Overcoming Addictions (Yaqeen Institute)",
    description:
      "Video series with Dr. Omar Husain discussing how pornography addiction affects faith, relationships and self-control from an Islamic psychological perspective.",
    category: "islamic",
    type: "guide",
    author: "Yaqeen Institute",
    readTime: 20,
    tags: ["video", "islamic", "yaqeen", "imancave"],
    url: "https://yaqeeninstitute.org/watch/series/iman-cave/overcoming-addictions-iman-cave",
  },
  {
    id: "resource-5b",
    title: "Advice to Muslims on the Means of Attaining Chastity",
    description:
      "Classic and contemporary guidance on protecting one's chastity through prayer, fasting, dhikr, and keeping good company.",
    category: "islamic",
    type: "article",
    author: "IslamWeb",
    readTime: 9,
    tags: ["chastity", "taqwa", "practical"],
    url: "https://www.islamweb.net/en/article/194782/advice-to-muslims-on-the-means-of-attaining-chastity",
  },
  {
    id: "resource-6",
    title: "NetPsychology: 30-Day Evidence-Based Action Plan",
    description:
      "A structured, shame-free 30-day plan for porn addiction recovery grounded in CBT, ACT and behavioural activation — no willpower myths.",
    category: "recovery",
    type: "guide",
    author: "NetPsychology",
    readTime: 18,
    tags: ["cbt", "act", "30-day-plan"],
    url: "https://netpsychology.org/porn-addiction-recovery-30-day",
  },
  {
    id: "health-1",
    title: "Exercise and Mental Health: A Meta-Analysis",
    description:
      "A 2023 systematic review in Journal of Psychiatric Research confirms regular exercise significantly reduces symptoms of depression and anxiety — key relapse drivers.",
    category: "health",
    type: "article",
    author: "Schuch et al., J Psychiatr Res 2023",
    readTime: 12,
    tags: ["exercise", "mental-health", "research"],
    url: "https://doi.org/10.1016/j.jpsychires.2023.08.001",
  },
  {
    id: "health-2",
    title: "Sleep Hygiene and Self-Control",
    description:
      "Walker (2017) and others show sleep deprivation degrades prefrontal cortex function, directly reducing willpower and increasing impulsive behaviour.",
    category: "health",
    type: "article",
    author: "Matthew Walker, Why We Sleep",
    readTime: 10,
    tags: ["sleep", "prefrontal", "willpower"],
    url: "https://www.netpsychology.org/porn-addiction-recovery-30-day",
  },
  {
    id: "health-3",
    title: "The First Step to Overcoming Addiction: An Islamic Guide",
    description:
      "IslamOnline’s guide to nafs-stage psychology, repentance, habit replacement, and practical taqwa-based boundaries for digital age triggers.",
    category: "islamic",
    type: "article",
    author: "IslamOnline",
    readTime: 11,
    tags: ["islamic", "nafs", "tawbah", "practical"],
    url: "https://islamonline.net/en/first-step-to-overcoming-addiction-islamic-guide",
  },
];

const TYPE_STYLE: Record<KnowledgeItem["type"], string> = {
  pdf: "border-danger/40 text-danger",
  guide: "border-accent/40 text-accent",
  article: "border-border text-ink-muted",
};

const TYPE_ICON = { pdf: FileText, guide: BookOpen, article: FileText } as const;

export default function Library() {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<KnowledgeItem | null>(null);
  const { isOnline, isSyncing, pendingCount, droppedCount } = useNetworkStatus();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return KNOWLEDGE_BASE.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [category, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, KnowledgeItem[]>();
    for (const item of results) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()].sort(
      ([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
    );
  }, [results]);

    /* ── Reader ─────────────────────────────────────────────────────────── */
    if (selected) {
      return (
        <Screen title="Library" back>
          <article className="card overflow-y-auto [-webkit-overflow-scrolling:touch] [touch-action:pan-y] [overscroll-behavior:contain] scrollbar-thin scrollbar-thumb-ink-muted scrollbar-track-transparent">
          <span
            className={cn(
              "inline-block rounded-full border px-2.5 py-1 text-label uppercase",
              TYPE_STYLE[selected.type],
            )}
          >
            {selected.type}
          </span>

          <h2 className="mt-3 text-display-l font-semibold text-ink">{selected.title}</h2>
          <p className="mt-2 text-body text-ink-muted">{selected.description}</p>

          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-y border-border py-3 font-data text-meta text-ink-muted">
            {selected.author && (
              <div>
                <dt className="sr-only">Author</dt>
                <dd>{selected.author}</dd>
              </div>
            )}
            {selected.readTime ? (
              <div className="inline-flex items-center gap-1.5">
                <dt className="sr-only">Reading time</dt>
                <Clock className="h-3 w-3" aria-hidden="true" />
                <dd>{selected.readTime} min</dd>
              </div>
            ) : null}
          </dl>

          {(selected.tags ?? []).length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {(selected.tags ?? []).map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-surface-2 px-2.5 py-1 font-data text-meta text-ink-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {selected.url ? (
            <p className="mt-6 rounded-md border border-dashed border-border bg-surface-2 px-4 py-6 text-center text-body-s text-ink-muted">
              {selected.description}
            </p>
          ) : (
            <p className="mt-6 rounded-md border border-dashed border-border bg-surface-2 px-4 py-6 text-center text-body-s text-ink-muted">
              This reference is being prepared. Check back soon for the full resource.
            </p>
          )}

          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mt-4 inline-flex h-11 items-center gap-2 px-1 text-label uppercase text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to library
          </button>
        </article>
      </Screen>
    );
  }

  /* ── Index ──────────────────────────────────────────────────────────── */
  return (
    <Screen title="Library" subtitle="Guides, articles and references">
      <div role="search">
        <label htmlFor="library-search" className="text-label uppercase text-ink-faint">
          Search
        </label>
        <div className="relative mt-2">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            id="library-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Guides, articles, PDFs…"
            className="h-12 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-body text-ink placeholder:text-ink-faint"
          />
        </div>
      </div>

      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            aria-pressed={category === cat.id}
            className={cn(
              "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-meta font-medium transition-colors duration-fast",
              category === cat.id
                ? "border-ink bg-ink text-bg"
                : "border-border text-ink-muted hover:border-ink-faint hover:text-ink",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="pt-8">
          <EmptyState
            icon={<BookOpen className="h-8 w-8" aria-hidden="true" />}
            title="Nothing matches that"
            description="Try a shorter search, or clear the filter to see everything."
          />
        </div>
      ) : (
        grouped.map(([cat, items]) => (
          <section key={cat}>
            <SectionHead>{CATEGORIES.find((c) => c.id === cat)?.label ?? cat}</SectionHead>
            <ul className="surface-group">
              {items.map((item) => {
                const Icon = TYPE_ICON[item.type];
                return (
                  <li key={item.id}>
                    <button type="button" onClick={() => setSelected(item)} className="row">
                      <span
                        className={cn(
                          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-transparent",
                          TYPE_STYLE[item.type],
                        )}
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-body-s font-medium leading-snug text-ink">
                          {item.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-meta text-ink-muted">
                          {item.description}
                        </span>
                        {item.readTime ? (
                          <span className="mt-1 inline-flex items-center gap-1 font-data text-meta text-ink-faint">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {item.readTime} min read
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
      {isOnline || pendingCount > 0 || droppedCount > 0 && (
        <div className="mt-8 p-4 bg-surface/50 border border-border rounded-lg">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <span className={cn(
                "h-3.5 w-3.5 shrink-0",
                isOnline ? "text-success" : "text-warning",
              )}>
                {isOnline ? "✓" : "✗"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-label font-medium text-ink">
                {isOnline ? "Relays synced" : "Relays offline"}
              </p>
              {pendingCount > 0 && (
                <p className="text-body-s text-ink-muted mt-0.5">
                  {pendingCount} {pendingCount === 1 ? "message waiting" : "messages waiting"}
                </p>
              )}
              {droppedCount > 0 && (
                <p className="text-body-s text-ink-muted mt-0.5">
                  {droppedCount} messages dropped
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {!(isOnline && pendingCount === 0 && droppedCount === 0) && (
        <div className="mt-8 p-4 bg-surface/50 border border-border rounded-lg">
          <h3 className="text-label font-semibold text-ink mb-2">
            How to find more relay networks
          </h3>
          <p className="text-body-s text-ink-muted">
            To add more relays, go to <a href="/settings/relay" className="text-ink underline hover:text-accent">Settings → Relay settings</a> and enter additional WebSocket URLs. Common public relays include:
          </p>
          <ul className="mt-2 text-body-s text-ink-muted space-y-1">
            <li>
              wss://nos.lol
            </li>
            <li>
              wss://relay.damus.io
            </li>
            <li>
              wss://relay.snort.social
            </li>
          </ul>
          <p className="mt-2 text-xs text-ink-muted">
            You can also use the Nostr NIP-11 discovery to find relays by visiting
            <a href="/#/vitals" className="text-ink underline hover:text-accent">
              your vitals page
            </a> and checking the relay status.
          </p>
        </div>
      )}
    </Screen>
  );
}