"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { FAQItem } from "@/types/cms";

/** Groups already-order-sorted items by category, keeping each category's first-seen order. */
function groupByCategory(items: FAQItem[]) {
  const groups: { category: string; items: FAQItem[] }[] = [];
  for (const item of items) {
    const key = item.category || "";
    let group = groups.find((g) => g.category === key);
    if (!group) {
      group = { category: key, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

export function FaqSearch({ items, locale }: { items: FAQItem[]; locale: string }) {
  const [query, setQuery] = useState("");
  const isEn = locale === "en";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.question.toLowerCase().includes(q) ||
        i.answer.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  const groups = groupByCategory(filtered);

  return (
    <>
      <div className="relative max-w-3xl mx-auto mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isEn ? "Search questions..." : "მოძებნეთ კითხვა..."}
          className="w-full rounded-2xl border border-border bg-card pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
        />
      </div>

      {groups.length > 0 ? (
        <div className="space-y-12">
          {groups.map((group) => (
            <div key={group.category || "uncategorized"} className="max-w-3xl mx-auto">
              {group.category && (
                <div className="mb-6 text-center">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">{group.category}</h2>
                  <div className="h-1 w-12 bg-gradient-to-r from-primary to-gold mt-3 mx-auto rounded-full" />
                </div>
              )}
              <div className="space-y-4">
                {group.items.map((f) => (
                  <div key={f._id} className="bg-card border border-border rounded-2xl p-6 md:p-7 text-center">
                    <p className="font-bold text-foreground mb-2">{f.question}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line text-justify">
                      {f.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-foreground/60 py-8 max-w-3xl mx-auto">
          {isEn ? "No results found." : "შედეგი ვერ მოიძებნა."}
        </p>
      )}
    </>
  );
}
