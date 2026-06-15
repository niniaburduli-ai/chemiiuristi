import Link from "next/link";
import { User2 } from "lucide-react";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { getNavMenu, getSiteConfig } from "@/lib/cms";

export async function Header() {
  const [session, nav, config] = await Promise.all([
    auth(),
    getNavMenu(),
    getSiteConfig(),
  ]);
  const user = session?.user;

  const siteName = config.siteName?.trim() || "ჩემი იურისტი";
  const tagline = config.tagline?.trim() || "კანონი მარტივ ენაზე";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex flex-col leading-tight shrink-0">
          <span className="text-lg font-bold text-[#1a1a2e] tracking-wide">
            {siteName}
          </span>
          <span className="text-xs text-[#6b7280] font-normal">
            {tagline}
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-5 text-sm">
          {nav.items.map((n) => (
            <Link
              key={n._id}
              href={n.href}
              target={n.isExternal ? "_blank" : undefined}
              rel={n.isExternal ? "noopener noreferrer" : undefined}
              className="text-[#374151] hover:text-[#1a1a2e] font-medium transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  ადმინი
                </Link>
              )}
              <Link
                href="/profile"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <User2 className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">{user.name ?? user.email}</span>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                შესვლა
              </Link>
              <Link
                href="/register"
                className={buttonVariants({ size: "sm" })}
                style={{ backgroundColor: "#1a1a2e", color: "#fff" }}
              >
                რეგისტრაცია
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
