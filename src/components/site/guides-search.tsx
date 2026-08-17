"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import type { GuideItem } from "@/types/cms";
import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/loc";
import { enPath } from "@/lib/seo";

export function GuidesSearch({ guides, locale }: { guides: GuideItem[]; locale: Locale }) {
  const isEn = locale === "en";
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guides;
    return guides.filter((g) => {
      const title = pick(g.title, g.titleEn, locale);
      const description = pick(g.description, g.descriptionEn, locale);
      const keywords = isEn ? (g.keywordsEn ?? []) : g.keywords;
      return (
        title.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [guides, query, locale, isEn]);

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isEn ? "Search a topic..." : "მოძებნეთ საკითხი..."}
          className="w-full rounded-2xl border border-border bg-card pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map((guide) => (
            <Link
              key={guide.slug}
              href={isEn ? enPath(`/guides/${guide.slug}`) : `/guides/${guide.slug}`}
              className="group bg-card border border-border rounded-2xl p-6 flex items-start justify-between gap-4 hover:border-primary/50 transition-colors"
            >
              <div>
                <h2 className="text-lg font-bold text-foreground group-hover:text-primary dark:group-hover:text-gold transition-colors">
                  {pick(guide.title, guide.titleEn, locale)}
                </h2>
                <p className="text-sm text-foreground/70 mt-1.5 leading-relaxed">
                  {pick(guide.description, guide.descriptionEn, locale)}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-foreground/40 group-hover:text-primary dark:group-hover:text-gold group-hover:translate-x-0.5 transition-all mt-1" />
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-foreground/60 py-8">
          {isEn ? "No results found." : "შედეგი ვერ მოიძებნა."}
        </p>
      )}
    </>
  );
}
