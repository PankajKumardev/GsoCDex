import Link from "next/link";

import { cn } from "@/lib/cn";

interface ChipProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  /** Show as compact pill (smaller padding). */
  compact?: boolean;
}

export function Chip({ href, children, className, compact = false }: ChipProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full",
        "border border-app-border bg-white text-app-ink",
        "shadow-sm transition-all hover:border-app-accent/30 hover:bg-app-accent-subtle hover:text-app-accent",
        compact ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm font-medium",
        className,
      )}
    >
      {children}
    </Link>
  );
}
