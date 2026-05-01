import Link from "next/link";

import { cn } from "@/lib/cn";

interface ChipRailProps {
  heading: string;
  /** Optional "View all →" link target. */
  viewAllHref?: string;
  /** Optional kicker shown above the heading. */
  kicker?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChipRail({ heading, viewAllHref, kicker, children, className }: ChipRailProps) {
  return (
    <section className={cn("my-10", className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="flex flex-col">
          {kicker && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-app-muted">
              {kicker}
            </span>
          )}
          <h2 className="text-lg font-semibold text-app-ink md:text-xl">{heading}</h2>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 text-sm font-medium text-app-accent hover:text-app-accent-hover"
          >
            View all →
          </Link>
        )}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {children}
      </div>
    </section>
  );
}
