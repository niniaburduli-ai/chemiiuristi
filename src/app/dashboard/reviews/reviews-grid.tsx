"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, FileSearch, AlertCircle, CheckCircle2, ChevronDown, Wand2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RiskFindingCard, isStructuredFinding } from "@/components/site/risk-finding-card";
import { TextDiff } from "@/components/site/text-diff";
import { DocumentDownloadButton } from "@/components/site/document-download-button";
import { formatDate } from "@/lib/utils";
import type { RiskFinding } from "@/lib/legal/document-analysis";
import type { DiffSegment } from "@/lib/diff-text";
import type { Dict } from "@/lib/i18n/dictionaries";

export type ReviewRevisionItem = {
  text: string;
  summary: string;
  findings: RiskFinding[];
  recommendations: string[];
  instruction: string;
  createdAt: string | null;
  diff: DiffSegment[];
};

export type ReviewItem = {
  id: string;
  fileName: string;
  createdAt: string | null;
  summary: string;
  findings: unknown[];
  recommendations: unknown[];
  revisions: ReviewRevisionItem[];
};

function RecommendationList({ recommendations }: { recommendations: unknown[] }) {
  return (
    <ul className="space-y-1">
      {recommendations.map((r, i) => (
        <li key={i} className="text-sm flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          {typeof r === "string"
            ? r
            : (r as { recommendation?: string; title?: string }).recommendation ??
              (r as { title?: string }).title ??
              JSON.stringify(r)}
        </li>
      ))}
    </ul>
  );
}

function ReviewDetail({ review }: { review: ReviewItem }) {
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const findings = review.findings ?? [];
  const recommendations = review.recommendations ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold leading-snug flex items-center gap-2">
            <FileSearch className="h-4 w-4 shrink-0 text-gold" />
            {review.fileName ?? "document"}
          </p>
          {review.createdAt && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-gold" /> {formatDate(review.createdAt)}
            </p>
          )}
        </div>
        <Link
          href={`/services?tab=docs&reviewId=${review.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline px-2 py-1.5 shrink-0"
        >
          <Play className="h-3 w-3 text-gold" /> განაგრძეთ
        </Link>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1">შეჯამება</p>
        <p className="text-sm leading-relaxed">{review.summary}</p>
      </div>

      {findings.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-gold" /> ნაპოვნი რისკები
          </p>
          <div className="space-y-2">
            {findings.map((f, i) =>
              isStructuredFinding(f) ? (
                <RiskFindingCard key={i} finding={f} locale="ka" />
              ) : (
                <div key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                  {String(f)}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-gold" /> რეკომენდაციები
          </p>
          <RecommendationList recommendations={recommendations} />
        </div>
      )}

      {review.revisions.length > 0 && (
        <div className="border-t border-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRevisionsOpen((v) => !v)}
            className="px-0 h-auto text-xs font-semibold text-muted-foreground flex items-center gap-1"
          >
            <Wand2 className="h-3 w-3 text-gold" /> შესწორების ისტორია
            <ChevronDown className={`h-3.5 w-3.5 text-gold transition-transform ${revisionsOpen ? "rotate-180" : ""}`} />
          </Button>

          {revisionsOpen && (
            <div className="space-y-3 mt-3">
              {review.revisions.map((rev, i) => (
                <div key={i} className="space-y-3 rounded-lg border border-border p-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      მოთხოვნა #{i + 1}
                    </p>
                    <p className="text-sm">
                      {rev.instruction.trim() || "შეასწორე ყველა გამოვლენილი რისკი."}
                    </p>
                    {rev.createdAt && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-gold" /> {formatDate(rev.createdAt)}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        შესწორებული ვერსია
                      </p>
                      <DocumentDownloadButton
                        content={rev.text}
                        filename={`${review.fileName || "document"}-corrected-${i + 1}`}
                      />
                    </div>
                    <TextDiff segments={rev.diff} />
                  </div>

                  {rev.findings.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        განახლებული რისკები
                      </p>
                      <div className="space-y-2">
                        {rev.findings.map((f, fi) => (
                          <RiskFindingCard key={fi} finding={f} locale="ka" />
                        ))}
                      </div>
                    </div>
                  )}

                  {rev.recommendations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        განახლებული რეკომენდაციები
                      </p>
                      <RecommendationList recommendations={rev.recommendations} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ReviewsGrid({ items, d }: { items: ReviewItem[]; d: Dict }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = items.find((it) => it.id === openId) ?? null;
  const dp = d.profile;

  return (
    <div className="flex flex-col h-full">
      <header className="p-5 border-b border-border shrink-0">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-gold" />
          {dp.analysisResults}
        </h3>
      </header>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12 px-5">
            {dp.noReviews}{" "}
            <Link href="/services?tab=docs" className="underline text-gold">
              {dp.uploadDoc}
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
            <ReviewDetail review={active} />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((review) => (
              <button
                key={review.id}
                type="button"
                onClick={() => setOpenId(review.id)}
                className="w-full text-left px-5 py-3 hover:bg-muted transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileSearch className="h-4 w-4 shrink-0 text-gold" />
                  <p className="text-sm font-medium truncate">{review.fileName ?? "document"}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gold" /> {formatDate(review.createdAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
