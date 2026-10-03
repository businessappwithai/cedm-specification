"use client";

/**
 * The help article library, as the body of the help toaster.
 *
 * This was `HelpDialog` — a Radix `Dialog` at `max-w-5xl h-[85vh]` with a
 * backdrop, an eighteen-button category rail down one side and the article on
 * the other. It covered the screen it was explaining, and Escape or a click
 * anywhere outside took it away: reading the SQL-editor article and writing
 * SQL were two different moments.
 *
 * It is the same three views in a 26rem panel now, and the width is what
 * decided the layout: the category rail is a `<select>`, because eighteen
 * buttons do not fit beside anything. Nothing about the content changed —
 * the articles, the search and the sanitising are exactly as they were.
 */

import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { ArrowLeft, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { HelpArticleRow } from "@/lib/db/kysely-db";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", name: "All Topics" },
  { id: "getting-started", name: "Getting Started" },
  { id: "dashboard", name: "Dashboard" },
  { id: "sql-editor", name: "SQL Editor" },
  { id: "reports", name: "Reports" },
  { id: "charts", name: "Charts" },
  { id: "dashboards", name: "Dashboards" },
  { id: "filters", name: "Filters" },
  { id: "jobs", name: "Scheduled Jobs" },
  { id: "monitoring", name: "Monitoring" },
  { id: "nl-query", name: "NL Query" },
  { id: "report-generator", name: "Report Generator" },
  { id: "data-sources", name: "Data Sources" },
  { id: "queue", name: "Queue" },
  { id: "logs", name: "Logs" },
  { id: "users", name: "Users & Roles" },
  { id: "settings", name: "Settings" },
  { id: "keyboard", name: "Keyboard Shortcuts" },
];

export function HelpPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<HelpArticleRow | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["help-articles", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      const res = await fetch(`/api/help/articles?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch help articles");
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || "Failed to fetch articles");
      return result;
    },
    // The panel only mounts while the toaster is open, so there is no `enabled`
    // gate to keep any more: mounting *is* the gate.
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  const articles: HelpArticleRow[] = response?.data ?? [];

  const filtered = articles.filter(
    (article) => activeCategory === "all" || article.category === activeCategory
  );

  /*
   * The sanitised body, already shaped as the prop React wants.
   *
   * Built here rather than inline for two reasons: the object identity is
   * stable across renders, and the attribute then fits on one line — a Biome
   * suppression has to sit directly above the line it suppresses, and the
   * formatter splitting this `<div>` across four lines is what detached it.
   */
  const articleHtml = useMemo(
    () => ({ __html: selectedArticle ? DOMPurify.sanitize(selectedArticle.content) : "" }),
    [selectedArticle]
  );

  if (selectedArticle) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSelectedArticle(null)}
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All articles
        </button>
        <div>
          <h3 className="text-sm font-semibold leading-tight">{selectedArticle.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{selectedArticle.summary}</p>
        </div>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: sanitised above */}
        <div className="help-article-content" dangerouslySetInnerHTML={articleHtml} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search help articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 pl-8 text-xs"
        />
      </div>

      <label className="block">
        <span className="sr-only">Help category</span>
        <select
          aria-label="Help category"
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </label>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading articles…</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No articles found. Try a different search or category.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((article) => (
            <button
              type="button"
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className={cn(
                "w-full rounded-lg border border-border/60 p-2.5 text-left transition-colors hover:bg-accent",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              )}
            >
              <p className="text-xs font-semibold leading-tight">{article.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{article.summary}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
