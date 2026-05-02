import Link from "next/link";

import { SearchTrigger } from "@/components/SearchTrigger";
import { Wordmark } from "@/components/Wordmark";

export function SiteHeader() {
  return (
    <header role="banner" className="sticky top-0 z-50 px-3 pt-3 md:px-4 md:pt-4">
      <div
        className="
          mx-auto flex h-16 max-w-7xl items-center gap-3 rounded-2xl
          border border-app-border bg-app-bg/85 px-4 backdrop-blur-xl
          shadow-header
          md:gap-6 md:px-6
        "
      >
        <Wordmark />
        <div className="flex-1">
          <SearchTrigger />
        </div>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <NavLink href="/browse">Browse</NavLink>
          <NavLink href="/tips">Tips</NavLink>
          <NavLink href="/submit">Submit</NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-app-muted hover:text-app-ink"
    >
      {children}
    </Link>
  );
}
