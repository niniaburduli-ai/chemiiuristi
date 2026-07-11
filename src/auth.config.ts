import type { NextAuthConfig } from "next-auth";
import { SITE_URL } from "@/lib/seo";

// Vercel serves both the apex and www domains as production aliases and can
// redirect between them mid-request. NextAuth's default cookies are host-only
// (no Domain attribute), so a PKCE/state cookie set on one host disappears if
// Google's callback redirect lands on the other — causing intermittent
// "pkceCodeVerifier could not be parsed" / "iss missing" login failures.
// Sharing a root-domain cookie keeps the OAuth handshake working across both.
const cookieDomain =
  process.env.VERCEL_ENV === "production"
    ? `.${new URL(SITE_URL).hostname.replace(/^www\./, "")}`
    : undefined;

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  cookies: cookieDomain
    ? {
        sessionToken: { options: { domain: cookieDomain } },
        callbackUrl: { options: { domain: cookieDomain } },
        pkceCodeVerifier: { options: { domain: cookieDomain } },
        state: { options: { domain: cookieDomain } },
        nonce: { options: { domain: cookieDomain } },
      }
    : undefined,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === "admin";
      const isAdminArea = nextUrl.pathname.startsWith("/admin");
      const isProtected =
        isAdminArea ||
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/profile") ||
        nextUrl.pathname.startsWith("/chat") ||
        nextUrl.pathname.startsWith("/billing") ||
        nextUrl.pathname.startsWith("/generate") ||
        nextUrl.pathname.startsWith("/review");
      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isProtected && !isLoggedIn) return false;
      if (isAdminArea && isLoggedIn && !isAdmin) return false;
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token?.id) session.user.id = token.id as string;
        session.user.role = (token.role as "user" | "admin") ?? "user";
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
