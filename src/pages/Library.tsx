import { useState, useEffect } from "react";
import { Search, BookOpen, FileText, ChevronRight, ArrowLeft, Menu, X, Download, Bookmark, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/Avatar";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { LoadingScreen } from "@/components/LoadingScreen";
import { cn } from "@/lib/utils";

interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "pdf" | "article" | "guide";
  author?: string;
  thumbnail?: string;
  url?: string;
  content?: string;
  readTime?: number;
  tags?: string[];
  publishedAt?: string;
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

const categoryOrder = ["guides", "articles", "pdfs", "recovery", "islamic", "health"];

// Sample knowledge base content
const KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: "guide-1",
    title: "Starting Your Streak: The First 7 Days",
    description: "A practical guide for the critical first week. Covers morning routines, trigger identification, and building momentum.",
    category: "guides",
    type: "guide",
    author: "Fursan Team",
    readTime: 8,
    tags: ["beginner", "streak", "routine"],
    publishedAt: "2024-01-15",
  },
  {
    id: "guide-2",
    title: "Understanding Triggers: The HALT Method",
    description: "Learn to recognize Hunger, Anger, Loneliness, and Tiredness as relapse precursors. Includes a printable worksheet.",
    category: "guides",
    type: "guide",
    author: "Dr. Ahmad",
    readTime: 12,
    tags: ["triggers", "psychology", "worksheet"],
    publishedAt: "2024-02-01",
  },
  {
    id: "article-1",
    title: "The Neuroscience of Addiction: What Happens in Your Brain",
    description: "Understanding dopamine, the reward pathway, and why willpower alone isn't enough. Science-backed explanation.",
    category: "articles",
    type: "article",
    author: "Dr. Sarah Khan",
    readTime: 15,
    tags: ["neuroscience", "dopamine", "science"],
    publishedAt: "2024-01-20",
  },
  {
    id: "article-2",
    title: "Building a Support System That Works",
    description: "How to find accountability partners, join groups, and create an environment that makes recovery easier.",
    category: "articles",
    type: "article",
    author: "Yusuf Ali",
    readTime: 10,
    tags: ["community", "support", "accountability"],
    publishedAt: "2024-02-10",
  },
  {
    id: "pdf-1",
    title: "The Fursan Recovery Workbook (PDF)",
    description: "Complete 30-day workbook with daily reflections, trigger logs, gratitude practice, and progress tracking.",
    category: "pdfs",
    type: "pdf",
    author: "Fursan Team",
    readTime: 0,
    tags: ["workbook", "30-day", "printable"],
    publishedAt: "2024-01-01",
  },
  {
    id: "pdf-2",
    title: "Islamic Perspective on Recovery (PDF)",
    description: "Quranic verses, hadith, and scholarly guidance on overcoming addiction from an Islamic perspective.",
    category: "pdfs",
    type: "pdf",
    author: "Sheikh Abdullah",
    readTime: 0,
    tags: ["islamic", "quran", "hadith", "spiritual"],
    publishedAt: "2024-01-10",
  },
  {
    id: "guide-3",
    title: "Managing Urges: The 15-Minute Rule",
    description: "When an urge hits, wait 15 minutes. Most urges pass. This guide teaches distraction techniques and grounding exercises.",
    category: "recovery",
    type: "guide",
    author: "Fursan Team",
    readTime: 5,
    tags: ["urges", "coping", "immediate"],
    publishedAt: "2024-02-20",
  },
  {
    id: "article-3",
    title: "Sleep, Stress, and Relapse: The Hidden Connection",
    description: "How poor sleep and chronic stress sabotage recovery. Includes sleep hygiene checklist and stress management tools.",
    category: "health",
    type: "article",
    author: "Dr. Fatima",
    readTime: 12,
    tags: ["sleep", "stress", "health", "lifestyle"],
    publishedAt: "2024-03-01",
  },
];

interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "pdf" | "article" | "guide";
  author?: string;
  thumbnail?: string;
  url?: string;
  content?: string;
  readTime?: number;
  tags?: string[];
  publishedAt?: string;
}

const Library = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Detail view - returns early if an item is selected
  if (selectedItem) {
    return (
      <div className="min-h-screen bg-bg pb-20">
        <Header syncState="synced" />
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <div className="flex items-center gap-3 mb-6 animate-fade-in">
            <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)} className="text-ink">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>
          
          <article className="card p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] rounded-full ${
                selectedItem.type === "pdf" ? "bg-danger/10 text-danger" :
                selectedItem.type === "guide" ? "bg-accent/10 text-accent" :
                "bg-success/10 text-success"
              }`}>
                {selectedItem.type.toUpperCase()}
              </span>
              <span className="text-xs text-ink-muted">{selectedItem.readTime > 0 ? `${selectedItem.readTime} min read` : "PDF"}</span>
            </div>
            
            <h1 className="text-2xl font-display font-extrabold tracking-tight text-ink mb-2">{selectedItem.title}</h1>
            <p className="text-ink-muted mb-4 leading-relaxed">{selectedItem.description}</p>
            
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedItem.tags?.map(tag => (
                <span key={tag} className="px-2 py-0.5 text-[10px] font-medium text-ink-muted bg-surface-2 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
            
<div className="flex items-center gap-3 pt-4 border-t border-border">
              {selectedItem.author && (
                <div className="flex items-center gap-2">
                  <Avatar name={selectedItem.author} size="sm" />
                  <span className="text-sm text-ink-muted">By {selectedItem.author}</span>
                </div>
              )}
            </div>

            {selectedItem.type === "pdf" && selectedItem.url ? (
              <div className="mt-6">
                <Button 
                  variant="default" 
                  className="w-full" 
                  onClick={() => window.open(selectedItem.url!, "_blank")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Open PDF
                </Button>
              </div>
            ) : null}

            {selectedItem.type !== "pdf" && selectedItem.content && (
              <div className="mt-6 prose prose-ink max-w-none">
                {selectedItem.content}
              </div>
            )}
</article>
        </div>
      <BottomNav />
    </div>
  );
  }

  // Main library view
  const filteredItems = KNOWLEDGE_BASE.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = 
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ?? false);
    return matchesCategory && matchesSearch;
  };

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, KnowledgeItem[]>);

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => 
    categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  return (
    <div className="min-h-screen bg-bg pb-20">
      <Header syncState="synced" />
      
      <div className="mx-auto max-w-screen-sm px-4 pt-2">
        {/* Header with search */}
        <header className="flex items-center justify-between py-4 animate-fade-in">
          <h1 className="text-xl font-display font-extrabold tracking-tight text-ink">Library</h1>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setShowMobileFilter(!showMobileFilter)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Search */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <Input
              type="search"
              placeholder="Search guides, articles, PDFs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-surface border border-border text-ink placeholder:text-ink-faint focus:border-accent"
            />
          </div>

          {/* Category filters */}
          <div className="mb-6">
            <div className={cn("flex gap-2 overflow-x-auto pb-2 px-2", showMobileFilter ? "flex" : "hidden")}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    selectedCategory === cat.id
                      ? "bg-ink text-bg"
                      : "bg-surface-2 text-ink-muted hover:bg-surface-2"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="animate-fade-in">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-ink-muted/30" />
                <p className="mt-4 text-ink-muted">No items found</p>
                <p className="text-xs text-ink-faint mt-1">Try adjusting your search or filter</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedCategories.map((cat, i) => (
                  <section key={cat} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <p className="section-title">
                      {CATEGORIES.find(c => c.id === cat)?.label || cat}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groupedItems[cat].map(item => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="card p-4 text-left group hover:border-accent/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-14 h-14 rounded-lg border border-border flex items-center justify-center flex-shrink-0",
                              item.type === "pdf" ? "bg-danger/10 text-danger" :
                              item.type === "guide" ? "bg-accent/10 text-accent" :
                              "bg-success/10 text-success"
                            )}>
                              {item.type === "pdf" && <FileText className="w-6 h-6" />}
                              {item.type === "guide" && <BookOpen className="w-6 h-6" />}
                              {item.type === "article" && <FileText className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-ink truncate">{item.title}</p>
                              <p className="text-[11px] text-ink-muted line-clamp-2 mt-0.5">{item.description}</p>
                              <div className="flex items-center gap-2 mt-2 text-[10px] text-ink-faint">
                                <span className="text-xs font-medium uppercase tracking-[0.1em] px-1.5 py-0.5 rounded border border-border">
                                  {item.type}
                                </span>
                                {item.readTime > 0 && (
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="h-2.5 w-2.5" />
                                    {item.readTime} min
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-ink-faint group-hover:text-accent transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Library;