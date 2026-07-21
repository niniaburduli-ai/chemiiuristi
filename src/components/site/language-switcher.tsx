"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Globe } from "lucide-react"
import { LOCALES, LOCALE_COOKIE, LOCALE_LABELS, type Locale } from "@/lib/i18n/config"

// Emoji flags render as bare "GE"/"GB" text on Windows (no flag glyphs in the
// system emoji font), so these are hand-rolled SVGs for consistent rendering.
function FlagGE({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#fff" />
      <rect x="10" width="4" height="16" fill="#e11" />
      <rect y="6" width="24" height="4" fill="#e11" />
      {[3, 20].map((cx) => (
        <g key={cx}>
          {[3, 12].map((cy) => (
            <g key={cy}>
              <rect x={cx - 1.5} y={cy - 0.6} width="3" height="1.2" fill="#e11" />
              <rect x={cx - 0.6} y={cy - 1.5} width="1.2" height="3" fill="#e11" />
            </g>
          ))}
        </g>
      ))}
    </svg>
  )
}

function FlagGB({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#00247d" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#fff" strokeWidth="2.6" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#cf142b" strokeWidth="1" />
      <path d="M12,0 V16 M0,8 H24" stroke="#fff" strokeWidth="4.4" />
      <path d="M12,0 V16 M0,8 H24" stroke="#cf142b" strokeWidth="2.6" />
    </svg>
  )
}

const LOCALE_FLAGS: Record<Locale, React.ComponentType<{ className?: string }>> = {
  ka: FlagGE,
  en: FlagGB,
}

export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter()

  function setLocale(locale: Locale) {
    if (locale === current) return
    // Persist the choice as a cookie (read server-side via getLocale), then refresh.
    // eslint-disable-next-line react-hooks/immutability -- document.cookie is a DOM write in an event handler
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 rounded-md border p-0.5">
      <Globe className="mx-1 h-3.5 w-3.5 shrink-0 text-gold animate-[spin_3s_linear_infinite]" />
      {LOCALES.map((l) => {
        const Flag = LOCALE_FLAGS[l]
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-label={LOCALE_LABELS[l]}
            title={LOCALE_LABELS[l]}
            className={[
              "rounded px-1 py-0.5 transition-opacity overflow-hidden",
              l === current ? "opacity-100 ring-1 ring-primary" : "opacity-50 hover:opacity-80",
            ].join(" ")}
          >
            <Flag className="h-4 w-6 rounded-[2px]" />
          </button>
        )
      })}
    </div>
  )
}
