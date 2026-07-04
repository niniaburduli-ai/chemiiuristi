"use client";

import { useState } from "react";
import { DocumentAnalysisModal } from "@/components/site/document-analysis-modal";
import type { Locale } from "@/lib/i18n/config";

export function ReviewModalTriggerLink({
  label,
  locale,
  className,
}: {
  label: string;
  locale: Locale;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      <DocumentAnalysisModal open={open} onOpenChange={setOpen} locale={locale} />
    </>
  );
}
