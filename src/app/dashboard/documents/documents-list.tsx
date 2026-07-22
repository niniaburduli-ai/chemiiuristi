"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, AlertTriangle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DocumentDownloadButton } from "@/components/site/document-download-button";
import { DOC_TYPES } from "@/lib/validators";
import { estimatePageCount } from "@/lib/page-count";
import { formatDate } from "@/lib/utils";
import type { Dict } from "@/lib/i18n/dictionaries";

export type GeneratedDocItem = {
  id: string;
  title: string;
  type: string;
  content: string;
  createdAt: string | null;
  source?: string;
};

function DocumentDetail({ doc }: { doc: GeneratedDocItem }) {
  const typeName = DOC_TYPES[doc.type as keyof typeof DOC_TYPES] ?? doc.type;
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{doc.title}</p>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {typeName}
            </Badge>
            {doc.createdAt && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 text-gold" />
                {formatDate(doc.createdAt)}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              ~{estimatePageCount(doc.content)} გვერდი
            </span>
          </div>
        </div>
        <DocumentDownloadButton content={doc.content} filename={`${doc.title}.txt`} />
      </div>

      <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <p>ხელშეკრულება შეინახება ისტორიაში 1 თვის ვადით, რის შემდეგაც ავტომატურად წაიშლება.</p>
      </div>

      <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/40 rounded p-3 leading-relaxed">
        {doc.content}
      </pre>
    </div>
  );
}

export function DocumentsList({
  docs,
  d,
  heading,
  emptyText,
  emptyCta,
  emptyHref,
}: {
  docs: GeneratedDocItem[];
  d: Dict;
  heading?: string;
  emptyText?: string;
  emptyCta?: string;
  emptyHref?: string;
}) {
  const dp = d.profile;
  const [openId, setOpenId] = useState<string | null>(null);
  const active = docs.find((doc) => doc.id === openId) ?? null;

  return (
    <div className="flex flex-col h-full">
      <header className="p-5 border-b border-border shrink-0">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-gold" />
          {heading ?? dp.generatedDocs}
        </h3>
      </header>

      <div className="flex-1 overflow-y-auto">
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12 px-5">
            {emptyText ?? dp.noDocs}{" "}
            <Link href={emptyHref ?? "/generate"} className="underline text-gold">
              {emptyCta ?? dp.createDoc}
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
            <DocumentDetail doc={active} />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {docs.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setOpenId(doc.id)}
                className="w-full text-left px-5 py-3 hover:bg-muted transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="h-4 w-4 shrink-0 text-gold" />
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gold" /> {formatDate(doc.createdAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
