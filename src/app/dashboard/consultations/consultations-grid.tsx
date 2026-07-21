"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, MessagesSquare } from "lucide-react";
import { groupItemsByArticle, type LegalBasisItem } from "@/lib/legal/citations";
import { renderMarkdownBold } from "@/lib/markdown-bold";
import { formatDate } from "@/lib/utils";
import type { Dict } from "@/lib/i18n/dictionaries";

export type RawSource = {
  title?: string;
  url?: string;
  article?: string;
  paragraph?: string;
  subparagraph?: string;
  /** Legacy: consultations saved before article/paragraph/subparagraph existed. */
  articleNumber?: string;
};

export type ConsultationItem = {
  id: string;
  question: string;
  answer: string;
  createdAt: string | null;
  sources: RawSource[];
};

type SourceGroup = {
  lawName: string;
  url?: string;
  articleGroups: Array<{ article: string; points: string[] }>;
};

/**
 * Same grouping the live chat view uses (groupItemsByArticle), so the history
 * view renders identical "Legal Basis" text for the same underlying data
 * instead of its own re-derivation.
 */
function groupSources(sources: RawSource[]): SourceGroup[] {
  const groups = new Map<string, { lawName: string; url?: string; items: LegalBasisItem[] }>();
  for (const s of sources) {
    const key = `${s.title ?? ""}|${s.url ?? ""}`;
    let g = groups.get(key);
    if (!g) {
      g = { lawName: s.title ?? "", url: s.url, items: [] };
      groups.set(key, g);
    }
    if (s.article) {
      g.items.push({
        article: s.article,
        paragraph: s.paragraph ?? null,
        subparagraph: s.subparagraph ?? null,
      });
    } else {
      g.items.push({ article: s.articleNumber ?? s.title ?? "", paragraph: null, subparagraph: null });
    }
  }
  return [...groups.values()].map((g) => ({
    lawName: g.lawName,
    url: g.url,
    articleGroups: groupItemsByArticle(g.items),
  }));
}

export function ConsultationsGrid({ items, d }: { items: ConsultationItem[]; d: Dict }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = items.find((it) => it.id === openId) ?? null;
  const dp = d.profile;

  return (
    <div className="flex flex-col h-full">
      <header className="p-5 border-b border-border shrink-0">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <MessagesSquare className="h-5 w-5 text-gold" />
          {dp.aiConsultations}
        </h3>
      </header>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12 px-5">
            {dp.noConsultations}{" "}
            <Link href="/chat" className="underline text-gold">
              {dp.startChat}
            </Link>
          </p>
        ) : active ? (
          <div className="p-5">
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-gold" /> {d.faq.back}
            </button>
            <p className="text-sm font-semibold leading-snug">{active.question}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 mb-4">
              <Clock className="h-3 w-3 text-gold" /> {formatDate(active.createdAt)}
            </p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {renderMarkdownBold(active.answer)}
            </p>
            {active.sources.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  {d.chat.legalBasis}
                </p>
                {groupSources(active.sources).map((g, i) => (
                  <div key={`${g.url ?? ""}|${i}`} className="space-y-1">
                    <p className="text-xs font-medium">{g.lawName}:</p>
                    <ul className="ml-1 space-y-0.5">
                      {g.articleGroups.map(({ article, points }) => (
                        <li key={article} className="text-xs text-muted-foreground">
                          {article}
                          {points.length > 1 && <>, {d.chat.articlePoints} {points.join("; ")}</>}
                          {points.length === 1 && <>, {d.chat.articlePoint} {points[0]}</>}
                        </li>
                      ))}
                    </ul>
                    {g.url && (
                      <a
                        href={g.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-start gap-1.5 text-xs text-gold hover:underline"
                      >
                        <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gold" />
                        <span>{d.chat.source}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setOpenId(item.id)}
                className="w-full text-left px-5 py-3 hover:bg-muted transition-colors flex items-center justify-between gap-4"
              >
                <p className="text-sm font-medium truncate flex-1">{item.question}</p>
                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gold" /> {formatDate(item.createdAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
