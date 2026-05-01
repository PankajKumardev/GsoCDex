import Link from "next/link";

import { OrgBadge } from "@/components/OrgBadge";
import { TechTag } from "@/components/TechTag";
import { cn } from "@/lib/cn";
import type { Organization, Proposal, TechTag as TechTagType } from "@/lib/schema";

interface ProposalCardProps {
  proposal: Proposal;
  org?: Organization;
  /** Map slug → label so we can render readable tech tags. */
  techTagsBySlug: Map<string, TechTagType>;
  className?: string;
  /** Cap visible tech tags. Default 4. */
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
    <article
      className={cn(
        "group relative rounded-2xl border border-app-border bg-white p-5",
        "shadow-card transition-shadow hover:shadow-card-hover",
        "focus-within:shadow-card-hover",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <OrgBadge
          name={proposal.organization}
          slug={proposal.orgSlug}
          logoUrl={org?.logoUrl}
          size="sm"
        />
        <Link
          href={`/org/${proposal.orgSlug}`}
          className="truncate text-sm font-medium text-app-muted hover:text-app-ink"
        >
          {proposal.organization}
        </Link>
        <span className="ml-auto font-mono text-xs text-app-muted">{proposal.year}</span>
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-tight text-app-ink">
        <Link
          href={href}
          prefetch={false}
          className="line-clamp-2 outline-none after:absolute after:inset-0 after:rounded-2xl"
        >
          {proposal.title}
        </Link>
      </h3>

      <p className="mt-1 text-sm text-app-muted">{proposal.contributor.displayName}</p>

      {visibleTags.length > 0 && (
        <div className="relative z-[1] mt-3 flex flex-wrap gap-1.5">
          {visibleTags.map((slug) => {
            const tag = techTagsBySlug.get(slug);
            return tag ? <TechTag key={slug} slug={slug} label={tag.label} /> : null;
          })}
          {overflow > 0 && (
            <span className="rounded-md bg-app-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-app-muted">
              +{overflow} more
            </span>
          )}
        </div>
      )}
    </article>
  );
}
