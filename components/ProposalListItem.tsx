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

/**
 * Denser variant of ProposalCard for long listings (e.g. /browse).
 * Same data; tighter padding; inline (single-row) on `md:` and up.
 */
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
        "group relative rounded-2xl border border-app-border bg-white p-4",
        "shadow-card transition-shadow hover:shadow-card-hover",
        className,
      )}
    >
      <div className="flex items-start gap-3">
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
              className="truncate text-sm font-medium text-app-muted hover:text-app-ink"
            >
              {proposal.organization}
            </Link>
            <span className="ml-auto font-mono text-xs text-app-muted">{proposal.year}</span>
          </div>
          <h3 className="mt-1 text-base font-semibold leading-snug text-app-ink">
            <Link
              href={href}
              prefetch={false}
              className="line-clamp-2 outline-none after:absolute after:inset-0 after:rounded-2xl"
            >
              {proposal.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-app-muted">{proposal.contributor.displayName}</p>
          {visibleTags.length > 0 && (
            <div className="relative z-[1] mt-2 flex flex-wrap gap-1.5">
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
