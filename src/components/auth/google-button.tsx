"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { googleSignInAction } from "@/actions/auth";
import { getDict } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.87c2.27-2.09 3.58-5.17 3.58-8.81Z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.28v3.11C3.25 21.3 7.31 24 12 24Z"/>
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1-.38-2.27c0-.79.14-1.56.38-2.27V6.62H1.28A11.98 11.98 0 0 0 0 12c0 1.94.47 3.77 1.28 5.38l3.99-3.11Z"/>
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.62l3.99 3.11C6.22 6.86 8.87 4.75 12 4.75Z"/>
    </svg>
  );
}

export function GoogleButton({
  label,
  requireConsent = false,
  locale,
}: {
  label?: string;
  requireConsent?: boolean;
  locale: Locale;
}) {
  const d = getDict(locale);
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const [consented, setConsented] = useState(false);
  const [isPending, startTransition] = useTransition();

  const buttonLabel = label ?? d.auth.googleContinue;

  const handleSignIn = () => {
    if (requireConsent && !consented) return;
    const fd = new FormData();
    fd.set("callbackUrl", callbackUrl);
    startTransition(async () => {
      await googleSignInAction(fd);
    });
  };

  return (
    <div className="space-y-3">
      {requireConsent && (
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3">
          <input
            type="checkbox"
            id="googleConsent"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#4338ca]"
          />
          <label
            htmlFor="googleConsent"
            className="text-xs text-muted-foreground leading-snug cursor-pointer select-none"
          >
            {d.auth.googleConsentPrefix}{" "}
            <Link
              href="/terms"
              target="_blank"
              className="text-foreground underline underline-offset-2 hover:text-[#4338ca]"
            >
              {d.auth.termsLink}
            </Link>
            {" "}{d.auth.and}{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="text-foreground underline underline-offset-2 hover:text-[#4338ca]"
            >
              {d.auth.privacyLink}
            </Link>
            .
          </label>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isPending || (requireConsent && !consented)}
        onClick={handleSignIn}
      >
        <GoogleIcon />
        {isPending ? "..." : buttonLabel}
      </Button>
    </div>
  );
}
