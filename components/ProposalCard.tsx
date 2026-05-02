import Link from "next/link";

import { Hoverable } from "@/components/Hoverable";
import { OrgBadge } from "@/components/OrgBadge";
import { TechTag } from "@/components/TechTag";
import { cn } from "@/lib/cn";
import type { Organization, Proposal, TechTag as TechTagType } from "@/lib/schema";

interface ProposalCardProps {
  proposal: Proposal;
  org?: Organization;
  techTagsBySlug: Map<string, TechTagType>;
  className?: string;
  techTagLimit?: number;
}

export function ProposalCard({
  proposal,
  org,
  techTagsBySlug,
  className,
  techTagLimit = 4,
}: ProposalCardProps) {
  const href = `/p/${proposal.year}/${proposal.orgSlug}/${proposal.slug}`;
  const visibleTags = proposal.techTags.slice(0, techTagLimit);
  const overflow = Math.max(0, proposal.techTags.length - visibleTags.length);

  return (
    <Hoverable
      as="article"
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-app-border",
        "bg-[color:var(--color-app-surface-elevated)] p-5 md:p-6",
        "shadow-card",
        className,
      )}
    >
      {/* Top row */}
      <div className="flex items-center gap-2.5">
        <OrgBadge
          name={proposal.organization}
          slug={proposal.orgSlug}
          logoUrl={org?.logoUrl}
          size="sm"
        />
        <Link
          href={`/org/${proposal.orgSlug}`}
          className="relative z-[2] truncate text-sm font-medium text-app-muted hover:text-app-ink"
        >
          {proposal.organization}
        </Link>
        <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.18em] text-app-muted">
          {proposal.year}
        </span>
      </div>

      {/* Title — serif */}
      <h3 className="mt-3 font-serif text-xl leading-snug tracking-tight text-app-ink md:text-[1.6rem] md:leading-[1.15]">
        <Link
          href={href}
          prefetch={false}
          className="line-clamp-2 outline-none after:absolute after:inset-0 after:rounded-2xl"
        >
          {proposal.title}
        </Link>
      </h3>

      {/* Author */}
      <p className="mt-1.5 font-sans text-sm italic text-app-muted">
        by {proposal.contributor.displayName}
      </p>

      {/* Tech tags */}
      {visibleTags.length > 0 && (
        <div className="relative z-[1] mt-4 flex flex-wrap gap-1.5">
          {visibleTags.map((slug) => {
            const tag = techTagsBySlug.get(slug);
            return tag ? <TechTag key={slug} slug={slug} label={tag.label} /> : null;
          })}
          {overflow > 0 && (
            <span className="rounded-md bg-app-bg px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-app-muted">
              +{overflow}
            </span>
          )}
        </div>
      )}
    </Hoverable>
  );
}
