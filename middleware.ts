import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);
// `auth` is a heavily overloaded helper (session lookup, route-handler wrapper,
// middleware...); used directly as Middleware — the same way NextAuth's own
// docs show `export { auth as middleware }` — it behaves as (request, event)
// => Response. TS's overload resolution doesn't reflect that usage, so it's
// cast once here.
const authMiddleware = auth as unknown as (
  request: NextRequest,
  event: NextFetchEvent
) => ReturnType<typeof NextResponse.next> | Promise<ReturnType<typeof NextResponse.next>>;

/** Header carrying a URL-derived locale into the request, read by src/lib/i18n/locale.ts. */
const URL_LOCALE_HEADER = "x-url-locale";

/**
 * Public routes that actually have translated body content (see the matching
 * `bilingual: true` list in src/lib/seo.ts — keep the two in sync). Everything
 * else stays Georgian-only; an /en/<other> hit just 404s instead of silently
 * rewriting into an app route with the wrong locale forced on it.
 * /guides is a dynamic route family (every slug is bilingual), so it's matched
 * by prefix below instead of being enumerated here.
 */
const EN_BILINGUAL_PATHS = new Set([
  "/",
  "/services",
  "/pricing",
  "/legislation",
  "/about",
  "/faq",
]);

/** Canonical production host. Everything else (www, vercel.app previews, etc) is a duplicate. */
const CANONICAL_HOST = "chemiiuristi.com";

async function routeRequest(
  request: NextRequest,
  event: NextFetchEvent
): Promise<ReturnType<typeof NextResponse.next>> {
  const { pathname } = request.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const stripped = pathname.slice(3); // "/en" -> "", "/en/services" -> "/services"
    const target = stripped === "" ? "/" : stripped;

    if (EN_BILINGUAL_PATHS.has(target) || target === "/guides" || target.startsWith("/guides/")) {
      const url = request.nextUrl.clone();
      url.pathname = target;
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(URL_LOCALE_HEADER, "en");
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
    return NextResponse.next();
  }

  return authMiddleware(request, event);
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { hostname } = request.nextUrl;

  if (hostname === `www.${CANONICAL_HOST}`) {
    const url = request.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  const response = await routeRequest(request, event);

  // Preview/deployment domains (*.vercel.app, branch previews) stay reachable
  // for QA but must never get indexed as duplicates of the real site.
  if (hostname !== CANONICAL_HOST) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
