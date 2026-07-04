"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { DocumentAnalysisModal } from "@/components/site/document-analysis-modal";
import type { Locale } from "@/lib/i18n/config";

export function ReviewQuickActionCard({
  reviewLabel,
  analysisLabel,
  locale,
}: {
  reviewLabel: string;
  analysisLabel: string;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block text-left w-full">
        <div className="border-t-[3px] border-t-primary bg-card border border-border rounded-2xl p-5 card-hover h-full flex flex-col gap-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{reviewLabel}</p>
          <p className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Search className="h-4 w-4 text-primary" /> {analysisLabel}
          </p>
        </div>
      </button>
      <DocumentAnalysisModal open={open} onOpenChange={setOpen} locale={locale} />
    </>
  );
}
