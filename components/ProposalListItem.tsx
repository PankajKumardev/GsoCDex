import Link from "next/link";

import { OrgBadge } from "@/components/OrgBadge";
import { TechTag } from "@/components/TechTag";
import { cn } from "@/lib/cn";
import type { Organization, Proposal, TechTag as TechTagType } from "@/lib/schema";

interface ProposalListItemProps {
  proposal: Proposal;
  org?: Organization;
  techTagsBySlug: Map<string, TechTagType>;
  className?: string;
}

/** Denser variant of ProposalCard for long listings (e.g. /browse). */
export function ProposalListItem({
  proposal,
  org,
  techTagsBySlug,
  className,
}: ProposalListItemProps) {
  const href = `/p/${proposal.year}/${proposal.orgSlug}/${proposal.slug}`;
  const visibleTags = proposal.techTags.slice(0, 5);

  return (
    <article
      className={cn(
        "group relative rounded-2xl border border-app-border bg-app-surface-elevated p-5",
        "shadow-card transition-all duration-300 hover:border-app-accent/30 hover:shadow-card-hover",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <OrgBadge
          name={proposal.organization}
          slug={proposal.orgSlug}
          logoUrl={org?.logoUrl}
          size="md"
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
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
          <h3 className="mt-1.5 font-serif text-lg leading-snug tracking-tight text-app-ink md:text-xl">
            <Link
              href={href}
              prefetch={false}
              className="line-clamp-2 outline-none after:absolute after:inset-0 after:rounded-2xl"
            >
              {proposal.title}
            </Link>
          </h3>
          <p className="mt-1 font-sans text-sm italic text-app-muted">
            by {proposal.contributor.displayName}
          </p>
          {visibleTags.length > 0 && (
            <div className="relative z-[1] mt-3 flex flex-wrap gap-1.5">
              {visibleTags.map((slug) => {
                const tag = techTagsBySlug.get(slug);
                return tag ? <TechTag key={slug} slug={slug} label={tag.label} /> : null;
              })}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
