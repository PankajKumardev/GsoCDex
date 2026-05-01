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
      className={cn("font-mono text-xs uppercase tracking-wider text-app-muted", className)}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, idx) => (
          <li key={`${c.label}-${idx}`} className="flex items-center gap-1.5">
            {idx > 0 && <span aria-hidden>/</span>}
            {c.href ? (
              <Link href={c.href} className="hover:text-app-ink">
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
