import Link from "next/link";

import { Hoverable } from "@/components/Hoverable";
import { ProposalCard } from "@/components/ProposalCard";
import { TrademarkNotice } from "@/components/TrademarkNotice";
import {
  getAllOrgs,
  getAllProposals,
  getAllTechTags,
  getAllTips,
  getSiteStats,
  getTopOrgs,
  getTopTechTags,
  getYearsCovered,
} from "@/lib/data";
import { SITE_DESCRIPTION } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "GSoCDex — Every accepted GSoC proposal, browsable.",
  description: SITE_DESCRIPTION,
  path: "/",
});

const FEED_SIZE = 18;

export default function HomePage() {
  const stats = getSiteStats();
  const proposals = getAllProposals().slice(0, FEED_SIZE);
  const techsBySlug = new Map(getAllTechTags().map((t) => [t.slug, t]));
  const orgsBySlug = new Map(getAllOrgs().map((o) => [o.slug, o]));
  const years = getYearsCovered();
  const topOrgs = getTopOrgs(8);
  const topTags = getTopTechTags(8);
  const tips = getAllTips().slice(0, 3);

  return (
    <div className="container-ledger relative pt-12 pb-24 md:pt-20">
      {/* HERO */}
      <section className="mx-auto max-w-5xl pt-8 text-center md:pt-16">
        <p className="label-caps">The GSoC proposal catalog · Vol. 01</p>
        <h1 className="mx-auto mt-6 max-w-4xl font-serif text-[2.75rem] font-medium leading-[0.95] tracking-tight text-app-ink md:text-[5rem] lg:text-[6rem] lg:leading-[0.85]">
          Every accepted GSoC{" "}
          <span className="font-serif italic text-app-accent">proposal.</span>{" "}
          <span className="block md:inline">Browsable.</span>
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-app-muted md:text-lg">
          A curated, mobile-first archive of accepted Google Summer of Code proposals — sourced
          from open community archives and presented with the gravitas the work deserves.
        </p>
        <p className="mt-5 inline-flex items-center gap-3 rounded-full border border-app-border bg-app-bg/70 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-app-muted">
          <span>{stats.proposalCount} proposals</span>
          <span aria-hidden>·</span>
          <span>{stats.yearCount} years</span>
          <span aria-hidden>·</span>
          <span>{stats.orgCount} orgs</span>
        </p>
      </section>

      {/* THE LEDGER — three columns: years, orgs, tech */}
      <section className="mt-24 md:mt-32">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="label-caps">§ I — The Ledger</p>
            <h2 className="mt-1 font-serif text-2xl tracking-tight text-app-ink md:text-3xl">
              Browse the catalog
            </h2>
          </div>
          <Link
            href="/browse"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-app-accent hover:underline"
          >
            View all →
          </Link>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <LedgerColumn
            title="By year"
            viewAllHref="/browse"
            items={years.map((y) => ({
              key: String(y),
              label: `GSoC ${y}`,
              count: getAllProposals().filter((p) => p.year === y).length,
              href: `/year/${y}`,
            }))}
          />
          <LedgerColumn
            title="By organization"
            viewAllHref="/org"
            items={topOrgs.map((o) => ({
              key: o.slug,
              label: o.name,
              count: o.proposalCount,
              href: `/org/${o.slug}`,
            }))}
          />
          <LedgerColumn
            title="By tech"
            viewAllHref="/tech"
            items={topTags.map(({ tag, count }) => ({
              key: tag.slug,
              label: tag.label,
              count,
              href: `/tech/${tag.slug}`,
            }))}
          />
        </div>
      </section>

      {/* THE FEED */}
      <section className="mt-24 md:mt-32">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="label-caps">§ II — Latest entries</p>
            <h2 className="mt-1 font-serif text-2xl tracking-tight text-app-ink md:text-3xl">
              Most recently catalogued
            </h2>
          </div>
          <Link
            href="/browse"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-app-accent hover:underline"
          >
            All {stats.proposalCount} →
          </Link>
        </header>

        {proposals.length === 0 ? (
          <EmptyFeed />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
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

        {proposals.length > 0 && stats.proposalCount > FEED_SIZE && (
          <div className="mt-10 flex justify-center">
            <Hoverable className="rounded-full">
              <Link
                href="/browse"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-app-border bg-app-surface-elevated px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-app-ink hover:text-app-accent"
              >
                View all {stats.proposalCount} proposals →
              </Link>
            </Hoverable>
          </div>
        )}
      </section>

      {/* TIPS */}
      {tips.length > 0 && (
        <section className="mt-24 md:mt-32">
          <header className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="label-caps">§ III — Editorial</p>
              <h2 className="mt-1 font-serif text-2xl tracking-tight text-app-ink md:text-3xl">
                Notes for the applicant
              </h2>
            </div>
            <Link
              href="/tips"
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-app-accent hover:underline"
            >
              All notes →
            </Link>
          </header>

          <div className="grid gap-5 md:grid-cols-3">
            {tips.map((tip) => (
              <Hoverable key={tip.slug} as="article" className="rounded-2xl">
                <Link
                  href={`/tips/${tip.slug}`}
                  className="block h-full rounded-2xl border border-app-border bg-app-surface-elevated p-6 shadow-card"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-app-muted">
                    {new Date(tip.frontmatter.lastUpdated).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })}
                  </span>
                  <h3 className="mt-3 font-serif text-xl leading-snug tracking-tight text-app-ink">
                    {tip.frontmatter.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-app-muted">
                    {tip.frontmatter.summary}
                  </p>
                </Link>
              </Hoverable>
            ))}
          </div>
        </section>
      )}

      {/* SUBMIT CTA */}
      <section className="mt-24 rounded-3xl border border-app-border bg-app-surface px-6 py-12 text-center md:mt-32 md:px-12 md:py-16">
        <p className="label-caps">An invitation</p>
        <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl tracking-tight text-app-ink md:text-4xl">
          Submitted a proposal?{" "}
          <span className="font-serif italic text-app-accent">Add it to the catalog.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-app-muted">
          Owner reviews each submission and links back to the original. No email collection,
          no signup, no nonsense.
        </p>
        <div className="mt-6">
          <Hoverable className="inline-block">
            <Link
              href="/submit"
              className="inline-flex items-center justify-center rounded-full bg-app-accent px-7 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-white hover:bg-app-accent-hover"
            >
              Submit a proposal
            </Link>
          </Hoverable>
        </div>
      </section>

      <div className="mt-16 text-center">
        <TrademarkNotice variant="footer" />
      </div>
    </div>
  );
}

function LedgerColumn({
  title,
  items,
  viewAllHref,
}: {
  title: string;
  items: Array<{ key: string; label: string; count: number; href: string }>;
  viewAllHref: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-app-border bg-app-bg/60">
      <div className="flex items-center justify-between border-b border-app-border px-4 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-app-muted">
          {title}
        </span>
        <Link
          href={viewAllHref}
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-app-accent hover:underline"
        >
          all
        </Link>
      </div>
      <ul className="divide-y divide-app-border">
        {items.map((it) => (
          <li key={it.key}>
            <Link
              href={it.href}
              className="
                group flex items-center justify-between gap-3 px-4 py-3
                font-mono text-[11px] uppercase tracking-[0.16em] text-app-ink
                transition-colors hover:bg-app-accent-soft/40 hover:text-app-accent-hover
              "
            >
              <span className="truncate">{it.label}</span>
              <span className="shrink-0 text-app-muted group-hover:text-app-accent">
                [{it.count}]
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="rounded-2xl border border-app-border bg-app-surface p-8 text-center">
      <p className="label-caps">No data yet</p>
      <h3 className="mt-3 font-serif text-xl text-app-ink">
        Run <code className="font-mono">pnpm ingest</code> to populate the catalog.
      </h3>
    </div>
  );
}
