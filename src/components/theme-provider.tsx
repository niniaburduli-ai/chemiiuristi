"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// next-themes injects an inline <script> to set the theme before paint (avoids
// FOUC). React 19 added a dev-only warning for <script> tags rendered by
// components, which false-positives here — the script still runs correctly
// via SSR. Upstream is unmaintained (pacocoursey/next-themes#387), so filter
// just this message rather than dropping the no-flash script.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag while rendering")) return
    originalError(...args)
  }
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
