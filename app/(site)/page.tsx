import Link from "next/link";

import { ChipRail } from "@/components/ChipRail";
import { Chip } from "@/components/Chip";
import { ProposalCard } from "@/components/ProposalCard";
import { TrademarkNotice } from "@/components/TrademarkNotice";
import {
  getAllProposals,
  getAllTechTags,
  getAllTips,
  getAllOrgs,
  getSiteStats,
  getTopOrgs,
  getTopTechTags,
  getYearsCovered,
} from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { SITE_DESCRIPTION } from "@/lib/constants";

export const metadata = buildMetadata({
  title: "GSoCDex — Every accepted GSoC proposal, browsable.",
  description: SITE_DESCRIPTION,
  path: "/",
});

const FEED_SIZE = 20;

export default function HomePage() {
  const stats = getSiteStats();
  const proposals = getAllProposals().slice(0, FEED_SIZE);
  const techsBySlug = new Map(getAllTechTags().map((t) => [t.slug, t]));
  const orgsBySlug = new Map(getAllOrgs().map((o) => [o.slug, o]));
  const years = getYearsCovered();
  const topOrgs = getTopOrgs(12);
  const topTags = getTopTechTags(12);
  const tips = getAllTips().slice(0, 3);
  const totalProposals = stats.proposalCount;

  return (
    <div className="container-content pb-24">
      <Hero stats={stats} />

      {years.length > 0 && (
        <ChipRail heading="Browse by year" kicker="Year" viewAllHref="/browse">
          {years.map((y) => (
            <Chip key={y} href={`/year/${y}`}>
              GSoC {y}
            </Chip>
          ))}
        </ChipRail>
      )}

      {topOrgs.length > 0 && (
        <ChipRail heading="Browse by organization" kicker="Orgs" viewAllHref="/org">
          {topOrgs.map((o) => (
            <Chip key={o.slug} href={`/org/${o.slug}`}>
              {o.name}
              <span className="ml-1 font-mono text-[10px] text-app-muted">{o.proposalCount}</span>
            </Chip>
          ))}
        </ChipRail>
      )}

      {topTags.length > 0 && (
        <ChipRail heading="Browse by tech" kicker="Tech" viewAllHref="/tech">
          {topTags.map(({ tag, count }) => (
            <Chip key={tag.slug} href={`/tech/${tag.slug}`}>
              {tag.label}
              <span className="ml-1 font-mono text-[10px] text-app-muted">{count}</span>
            </Chip>
          ))}
        </ChipRail>
      )}

      {/* Feed */}
      <section className="mt-12" aria-label="Latest accepted proposals">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-xl font-semibold text-app-ink md:text-2xl">Latest proposals</h2>
          {totalProposals > FEED_SIZE && (
            <Link
              href="/browse"
              className="text-sm font-medium text-app-accent hover:text-app-accent-hover"
            >
              View all {totalProposals} →
            </Link>
          )}
        </div>
        {proposals.length === 0 ? (
          <EmptyFeed />
        ) : (
          <div className="flex flex-col gap-4">
            {proposals.map((p) => (
              <ProposalCard
                key={p.slug}
                proposal={p}
                org={orgsBySlug.get(p.orgSlug)}
                techTagsBySlug={techsBySlug}
              />
            ))}
          </div>
        )}
        {totalProposals > FEED_SIZE && proposals.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center rounded-lg border border-app-border bg-white px-5 py-3 text-sm font-medium text-app-ink shadow-sm transition-colors hover:bg-app-surface"
            >
              View all {totalProposals} proposals
            </Link>
          </div>
        )}
      </section>

      {/* Tips */}
      {tips.length > 0 && (
        <section className="mt-20" aria-label="Tips for applicants">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-app-muted">
                Editorial
              </span>
              <h2 className="text-xl font-semibold text-app-ink md:text-2xl">
                Tips for applicants
              </h2>
            </div>
            <Link
              href="/tips"
              className="text-sm font-medium text-app-accent hover:text-app-accent-hover"
            >
              All tips →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {tips.map((tip) => (
              <Link
                key={tip.slug}
                href={`/tips/${tip.slug}`}
                className="group rounded-2xl border border-app-border bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-app-muted">
                  {new Date(tip.frontmatter.lastUpdated).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <h3 className="mt-2 text-base font-semibold leading-snug text-app-ink">
                  {tip.frontmatter.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-app-muted">{tip.frontmatter.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-24 rounded-2xl border border-app-border bg-app-surface p-6 text-center md:p-8">
        <h2 className="text-lg font-semibold text-app-ink md:text-xl">
          Submitted a GSoC proposal?
        </h2>
        <p className="mt-2 text-sm text-app-muted md:text-base">
          Add yours to GSoCDex. We review every submission and link back to the original.
        </p>
        <div className="mt-4">
          <Link
            href="/submit"
            className="inline-flex items-center justify-center rounded-lg bg-app-accent px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-app-accent-hover"
          >
            Submit a proposal
          </Link>
        </div>
      </section>

      <div className="mt-16 text-center">
        <TrademarkNotice variant="footer" />
      </div>
    </div>
  );
}

function Hero({ stats }: { stats: ReturnType<typeof getSiteStats> }) {
  return (
    <section className="pt-12 text-center md:pt-20">
      <p className="font-mono text-[11px] uppercase tracking-wider text-app-muted">
        The GSoC proposal archive
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-app-ink md:text-5xl lg:text-6xl">
        Every accepted GSoC proposal, browsable.
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base text-app-muted md:text-lg">
        Search{" "}
        <span className="font-mono text-app-ink">{stats.proposalCount}</span>{" "}
        accepted proposals from{" "}
        <span className="font-mono text-app-ink">{stats.yearCount}</span>{" "}
        years across{" "}
        <span className="font-mono text-app-ink">{stats.orgCount}</span>{" "}
        organizations. Free, fast, no signup.
      </p>
    </section>
  );
}

function EmptyFeed() {
  return (
    <div className="rounded-2xl border border-app-border bg-app-surface p-8 text-center">
      <p className="font-mono text-[10px] uppercase tracking-wider text-app-muted">No data yet</p>
      <h3 className="mt-2 text-base font-semibold text-app-ink">
        Run <code className="font-mono">pnpm ingest</code>
      </h3>
      <p className="mt-1 text-sm text-app-muted">
        The proposal feed populates the moment data lands.
      </p>
    </div>
  );
}
