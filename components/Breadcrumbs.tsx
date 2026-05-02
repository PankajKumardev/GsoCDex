import Link from "next/link";

import { cn } from "@/lib/cn";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "font-sans text-xs uppercase tracking-[0.22em] text-app-muted",
        className,
      )}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((c, idx) => (
          <li key={`${c.label}-${idx}`} className="flex items-center gap-2">
            {idx > 0 && <span aria-hidden className="text-app-muted-2">/</span>}
            {c.href ? (
              <Link href={c.href} className="hover:text-app-accent">
                {c.label}
              </Link>
            ) : (
              <span className="text-app-ink">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
