import { ArrowUpRight, Calendar } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Hoverable } from "@/components/Hoverable";
import { OrgBadge } from "@/components/OrgBadge";
import { PDFOpenButton } from "@/components/PDFOpenButton";
import { ProposalCard } from "@/components/ProposalCard";
import { SponsorSlot } from "@/components/SponsorSlot";
import { TechTag } from "@/components/TechTag";
import {
  getAllOrgs,
  getAllProposals,
  getAllTechTags,
  getOrgBySlug,
  getProposalBySlugParts,
  getProposalsByOrg,
  getProposalsByYear,
  getRelatedProposals,
} from "@/lib/data";
import { formatKB, formatPages, pluralize } from "@/lib/format";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildMetadata,
  jsonLdScript,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ year: string; org: string; slug: string }>;
}

export function generateStaticParams() {
  return getAllProposals().map((p) => ({
    year: String(p.year),
    org: p.orgSlug,
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { year, org, slug } = await params;
  const p = getProposalBySlugParts(year, org, slug);
  if (!p) return buildMetadata({ title: "Proposal", path: `/p/${year}/${org}/${slug}` });
  const description =
    p.description ??
    `Accepted GSoC ${p.year} proposal by ${p.contributor.displayName} for ${p.organization}. ${formatPages(
      p.pdfPages,
    )} — read in-browser.`;
  return buildMetadata({
    title: `${p.title} — ${p.organization} (${p.year})`,
    description,
    path: `/p/${year}/${org}/${slug}`,
  });
}

function formatProposalHeadline(p: import("@/lib/schema").Proposal): {
  prefix: string;
  org: string;
  byline: string;
} {
  // Render as: "GSoC {year} Project: {Org}" + italic gold "proposal" + "by {Author}"
  return {
    prefix: `GSoC ${p.year} Project:`,
    org: p.organization,
    byline: p.contributor.displayName,
  };
}

export default async function ProposalPage({ params }: PageProps) {
  const { year, org, slug } = await params;
  const p = getProposalBySlugParts(year, org, slug);
  if (!p) notFound();

  const organization = getOrgBySlug(p.orgSlug);
  const techsBySlug = new Map(getAllTechTags().map((t) => [t.slug, t]));
  const orgsBySlug = new Map(getAllOrgs().map((o) => [o.slug, o]));

  const moreFromOrg = getProposalsByOrg(p.orgSlug)
    .filter((x) => x.slug !== p.slug)
    .slice(0, 5);
  const sameYear = getProposalsByYear(p.year).filter((x) => x.slug !== p.slug).slice(0, 4);
  const related = getRelatedProposals(p, 4);
  const headline = formatProposalHeadline(p);

  return (
    <article className="container-ledger relative pb-24 pt-12 md:pt-16">
      <Breadcrumbs
        items={[
          { label: "GSoCDex", href: "/" },
          { label: String(p.year), href: `/year/${p.year}` },
          { label: p.organization, href: `/org/${p.orgSlug}` },
          { label: p.contributor.displayName },
        ]}
        className="mb-6 font-sans text-xs uppercase tracking-[0.22em]"
      />

      {/* Headline */}
      <header className="max-w-4xl">
        <h1 className="font-serif text-[2.25rem] font-medium leading-[1.05] tracking-tight text-app-ink md:text-5xl lg:text-[3.75rem]">
          {headline.prefix}{" "}
          <span className="block md:inline">
            {headline.org}{" "}
            <span className="font-serif italic text-app-accent">proposal</span>{" "}
            <span className="text-app-muted">by</span>{" "}
            <span className="text-app-ink">{headline.byline}</span>
          </span>
        </h1>
      </header>

      {/* Two-column monolith */}
      <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_320px] md:gap-12">
        {/* MAIN COLUMN */}
        <div className="min-w-0">
          {/* Status + meta chips */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-app-accent/25 bg-app-accent-bg px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-app-accent-hover">
              ● Accepted
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-app-border bg-app-bg/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-app-muted">
              <Calendar className="h-3 w-3" aria-hidden /> GSoC {p.year}
            </span>
            <Link
              href={`/org/${p.orgSlug}`}
              className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-bg/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-app-ink hover:border-app-accent/30 hover:text-app-accent"
            >
              <OrgBadge name={p.organization} slug={p.orgSlug} logoUrl={organization?.logoUrl} size="sm" />
              {p.organization}
            </Link>
            {p.projectLength && (
              <span className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-bg/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-app-muted">
                {p.projectLength} hr track
              </span>
            )}
          </div>

          {p.techTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.techTags.map((s) => {
                const t = techsBySlug.get(s);
                return t ? <TechTag key={s} slug={s} label={t.label} /> : null;
              })}
            </div>
          )}

          {/* Open PDF — primary CTA */}
          <div className="mt-8">
            <PDFOpenButton pdfPath={p.pdfPath} title={p.title} />
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-app-muted">
              In-browser preview · Vector-sharp · No download required
            </p>
          </div>

          {/* Body */}
          <ProposalContextBody p={p} />

          <SponsorSlot variant="inline" seed={p.slug} />

          {related.length > 0 && (
            <section className="mt-16">
              <header className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="label-caps">Related</p>
                  <h2 className="mt-1 font-serif text-2xl tracking-tight text-app-ink">
                    Adjacent proposals
                  </h2>
                </div>
                <Link
                  href="/browse"
                  className="font-mono text-[11px] uppercase tracking-[0.2em] text-app-accent hover:underline"
                >
                  Browse all →
                </Link>
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                {related.map((r) => (
                  <ProposalCard
                    key={r.slug}
                    proposal={r}
                    org={orgsBySlug.get(r.orgSlug)}
                    techTagsBySlug={techsBySlug}
                  />
                ))}
              </div>
            </section>
          )}

          {sameYear.length > 0 && (
            <section className="mt-16">
              <header className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="label-caps">Same vintage</p>
                  <h2 className="mt-1 font-serif text-2xl tracking-tight text-app-ink">
                    Other proposals from {p.year}
                  </h2>
                </div>
                <Link
                  href={`/year/${p.year}`}
                  className="font-mono text-[11px] uppercase tracking-[0.2em] text-app-accent hover:underline"
                >
                  All from {p.year} →
                </Link>
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                {sameYear.map((r) => (
                  <ProposalCard
                    key={r.slug}
                    proposal={r}
                    org={orgsBySlug.get(r.orgSlug)}
                    techTagsBySlug={techsBySlug}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Source attribution */}
          <section className="mt-16 rounded-2xl border border-app-border bg-app-surface p-6 md:p-8">
            <p className="label-caps">Source &amp; attribution</p>
            <p className="mt-3 text-sm leading-relaxed text-app-ink">
              Sourced from{" "}
              <a
                href={p.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-app-accent underline-offset-2 hover:underline"
              >
                {p.sourceRepo}
              </a>{" "}
              under its permissive open-source license. The original PDF and content are{" "}
              © {p.contributor.displayName}.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-app-muted">
              If you authored this proposal and would like it removed, file a request via{" "}
              <Link href="/disclosures" className="text-app-accent hover:underline">
                our removal flow
              </Link>
              . Removals are honoured within 7 days.
            </p>
          </section>
        </div>

        {/* STICKY SIDEBAR LEDGER */}
        <aside className="md:sticky md:top-28 md:self-start">
          <div className="flex flex-col gap-4">
            <StatBlock
              label="Pages"
              value={p.pdfPages !== undefined ? String(p.pdfPages) : "—"}
            />
            <StatBlock label="File size" value={formatKB(p.pdfSizeKB)} mono={false} />
            <StatBlock label="Tags" value={String(p.techTags.length)} />

            {/* Source card */}
            <Hoverable className="rounded-xl">
              <a
                href={p.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl border border-app-border bg-app-surface-elevated p-5 shadow-card"
              >
                <span className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-app-muted">
                    Source
                  </span>
                  <span className="mt-1 font-sans text-sm font-medium text-app-ink">
                    {p.sourceRepo}
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-app-accent" aria-hidden />
              </a>
            </Hoverable>

            {moreFromOrg.length > 0 && (
              <div className="rounded-xl border border-app-border bg-app-surface-elevated p-5 shadow-card">
                <p className="label-caps">More from {p.organization}</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {moreFromOrg.map((m) => (
                    <li key={m.slug}>
                      <Link
                        href={`/p/${m.year}/${m.orgSlug}/${m.slug}`}
                        className="block text-sm text-app-ink hover:text-app-accent"
                      >
                        <span className="font-mono text-xs text-app-muted">{m.year}</span>{" "}
                        <span>{m.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/org/${p.orgSlug}`}
                  className="mt-4 inline-flex font-mono text-[10px] uppercase tracking-[0.2em] text-app-accent hover:underline"
                >
                  All from {p.organization} →
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(articleJsonLd(p)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: String(p.year), path: `/year/${p.year}` },
              { name: p.organization, path: `/org/${p.orgSlug}` },
              { name: p.contributor.displayName, path: `/p/${p.year}/${p.orgSlug}/${p.slug}` },
            ]),
          ),
        }}
      />
    </article>
  );
}

function StatBlock({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-app-border bg-app-surface-elevated p-6 shadow-ambient">
      <span className="font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-app-muted">
        {label}
      </span>
      <div
        className={
          "mt-2 leading-none text-app-ink " +
          (mono ? "font-mono text-[2.5rem]" : "font-serif text-[2rem]")
        }
      >
        {value}
      </div>
    </div>
  );
}

function ProposalContextBody({ p }: { p: import("@/lib/schema").Proposal }) {
  const tagText =
    p.techTags.length > 0
      ? p.techTags.map((s) => s.replace(/-/g, " ")).join(", ")
      : "no tech tags detected";

  return (
    <section className="mt-12 max-w-2xl text-base leading-relaxed text-app-ink/90">
      <h2 className="font-serif text-2xl tracking-tight text-app-ink md:text-3xl">
        About this entry
      </h2>
      <p className="mt-4">
        An accepted Google Summer of Code {p.year} proposal authored by{" "}
        <strong>{p.contributor.displayName}</strong> for{" "}
        <Link href={`/org/${p.orgSlug}`} className="text-app-accent hover:underline">
          {p.organization}
        </Link>
        . The original PDF runs to{" "}
        <span className="font-mono text-sm">{formatPages(p.pdfPages)}</span>
        {p.pdfSizeKB ? (
          <span className="font-mono text-sm"> ({formatKB(p.pdfSizeKB)})</span>
        ) : null}
        .
      </p>
      {p.description && <p className="mt-4">{p.description}</p>}
      <p className="mt-4 text-app-muted">
        Curated from the{" "}
        <a
          href={p.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-app-accent hover:underline"
        >
          {p.sourceRepo}
        </a>{" "}
        community archive. {pluralize(p.techTags.length, "tech tag")} were detected automatically:{" "}
        <span className="font-mono text-sm uppercase tracking-[0.12em]">{tagText}</span>.
        Tags are derived by lexical match against a curated vocabulary — no AI, no embeddings.
      </p>
      <p className="mt-4 text-app-muted">
        GSoCDex is an independent reader for accepted GSoC proposals — built so applicants can
        learn from past work without navigating GitHub folders. We never collect emails, never
        run AI on this content, and we credit every source.
      </p>
    </section>
  );
}
