import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { pickSponsor } from "@/lib/sponsors";

interface SponsorSlotProps {
  variant?: "inline" | "sidebar" | "sticky";
  /** Stable seed for deterministic sponsor selection. */
  seed?: string;
  className?: string;
}

export function SponsorSlot({ variant = "inline", seed, className }: SponsorSlotProps) {
  const sponsor = pickSponsor(seed);
  // No active sponsor configured → render nothing. We never display
  // placeholder rows so the owner can ship sponsor-free until a real
  // partner is signed.
  if (!sponsor) return null;

  if (variant === "sticky") {
    return (
      <a
        href={sponsor.ctaUrl}
        target="_blank"
        rel="noopener sponsored"
        className={cn(
          "flex w-full items-center gap-3 border-t border-app-border bg-white px-4 py-3",
          "shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.04)]",
          "transition-colors hover:bg-app-surface",
          className,
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-app-accent-subtle text-app-accent">
          <SponsorIcon name={sponsor.name} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-app-ink">{sponsor.tagline}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-app-muted">
            Sponsored
          </span>
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-app-muted" aria-hidden />
      </a>
    );
  }

  return (
    <aside
      className={cn(
        "rounded-2xl border border-app-border bg-app-surface p-4",
        variant === "inline" ? "my-8" : "",
        className,
      )}
    >
      <div className="font-mono text-[10px] uppercase tracking-wider text-app-muted">
        Sponsored
      </div>
      <a
        href={sponsor.ctaUrl}
        target="_blank"
        rel="noopener sponsored"
        className="mt-2 flex items-start gap-3"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white">
          <SponsorIcon name={sponsor.name} />
        </span>
        <span className="flex-1">
          <span className="block text-base font-semibold text-app-ink">{sponsor.name}</span>
          <span className="mt-1 block text-sm leading-relaxed text-app-muted">
            {sponsor.tagline}
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-app-accent">
            Learn more <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </span>
      </a>
    </aside>
  );
}

function SponsorIcon({ name }: { name: string }) {
  return (
    <span className="font-mono text-sm font-semibold">{name.charAt(0)}</span>
  );
}
