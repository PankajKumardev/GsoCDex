import Link from "next/link";

import { SearchTrigger } from "@/components/SearchTrigger";
import { Wordmark } from "@/components/Wordmark";

export function SiteHeader() {
  return (
    <header
      role="banner"
      className="fixed inset-x-0 top-0 z-50 border-b border-app-border bg-white/80 shadow-header backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:gap-6">
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
      className="rounded-lg px-3 py-2 text-sm font-medium text-app-ink hover:bg-app-surface"
    >
      {children}
    </Link>
  );
}
