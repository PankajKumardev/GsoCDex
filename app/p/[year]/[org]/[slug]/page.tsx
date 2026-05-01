import { ArrowUpRight, Calendar, FileText, GitBranch } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs";
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
  const sameYear = getProposalsByYear(p.year).filter((x) => x.slug !== p.slug).slice(0, 6);
  const related = getRelatedProposals(p, 6);

  const breadcrumbs = [
    { label: "GSoCDex", href: "/" },
    { label: String(p.year), href: `/year/${p.year}` },
    { label: p.organization, href: `/org/${p.orgSlug}` },
    { label: p.contributor.displayName },
  ];

  return (
    <article className="container-wide pb-24 pt-8">
      <Breadcrumbs
        items={breadcrumbs.map((b) => ({ label: b.label, href: b.href }))}
        className="mb-4"
      />

      <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-app-ink md:text-3xl lg:text-4xl">
        {p.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-app-muted">
        <Link
          href={`/org/${p.orgSlug}`}
          className="inline-flex items-center gap-2 rounded-full bg-app-surface px-3 py-1.5 hover:text-app-ink"
        >
          <OrgBadge name={p.organization} slug={p.orgSlug} logoUrl={organization?.logoUrl} size="sm" />
          <span className="font-medium">{p.organization}</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-app-surface px-3 py-1.5 font-mono text-xs uppercase tracking-wider">
          <Calendar className="h-3 w-3" aria-hidden /> GSoC {p.year}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-app-surface px-3 py-1.5">
          <span className="font-medium text-app-ink">{p.contributor.displayName}</span>
        </span>
        {p.projectLength && (
          <span className="inline-flex items-center gap-1 rounded-full bg-app-surface px-3 py-1.5 font-mono text-xs uppercase tracking-wider">
            {p.projectLength} hr
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-status-accepted/10 px-3 py-1.5 font-medium text-status-accepted">
          Accepted
        </span>
      </div>

      {p.techTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.techTags.map((s) => {
            const t = techsBySlug.get(s);
            return t ? <TechTag key={s} slug={s} label={t.label} /> : null;
          })}
        </div>
      )}

      <div className="mt-6">
        <PDFOpenButton pdfPath={p.pdfPath} title={p.title} />
      </div>

      {/* Secondary info grid */}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <InfoCard heading="Quick info">
          <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="File size" value={formatKB(p.pdfSizeKB)} />
          <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Pages" value={formatPages(p.pdfPages)} />
          <InfoRow
            icon={<GitBranch className="h-3.5 w-3.5" />}
            label="Source"
            value={
              <a
                href={p.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-app-accent hover:underline"
              >
                {p.sourceRepo}
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              </a>
            }
          />
        </InfoCard>

        <InfoCard heading="More from this org">
          {moreFromOrg.length === 0 ? (
            <p className="text-sm text-app-muted">No other proposals indexed yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {moreFromOrg.map((m) => (
                <li key={m.slug}>
                  <Link
                    href={`/p/${m.year}/${m.orgSlug}/${m.slug}`}
                    className="block text-sm text-app-ink hover:text-app-accent"
                  >
                    <span className="font-mono text-xs text-app-muted">{m.year} ·</span>{" "}
                    {m.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/org/${p.orgSlug}`}
            className="mt-3 inline-flex text-sm font-medium text-app-accent hover:underline"
          >
            All from {p.organization} →
          </Link>
        </InfoCard>

        <InfoCard heading="Similar tech">
          {p.techTags.length === 0 ? (
            <p className="text-sm text-app-muted">No tech tags detected.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {p.techTags.map((s) => {
                const t = techsBySlug.get(s);
                return t ? <TechTag key={s} slug={s} label={t.label} /> : null;
              })}
            </div>
          )}
        </InfoCard>
      </div>

      {/* Auto-generated body content for SEO + reader context (≥150 words) */}
      <ProposalContextBody p={p} relatedTechCount={p.techTags.length} />

      <SponsorSlot variant="inline" seed={p.slug} />

      {/* Related proposals */}
      {related.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-xl font-semibold text-app-ink">Related proposals</h2>
            <Link href="/browse" className="text-sm font-medium text-app-accent hover:underline">
              Browse all →
            </Link>
          </div>
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

      {/* Same year rail */}
      {sameYear.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-xl font-semibold text-app-ink">Other proposals from {p.year}</h2>
            <Link
              href={`/year/${p.year}`}
              className="text-sm font-medium text-app-accent hover:underline"
            >
              All from {p.year} →
            </Link>
          </div>
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

      {/* Source attribution — must be prominent, not buried */}
      <section className="mt-12 rounded-2xl border border-app-border bg-app-surface p-6">
        <span className="font-mono text-[10px] uppercase tracking-wider text-app-muted">
          Source
        </span>
        <p className="mt-2 text-sm text-app-ink">
          This proposal was sourced from{" "}
          <a
            href={p.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-app-accent underline-offset-2 hover:underline"
          >
            {p.sourceRepo}
          </a>
          . The original PDF and content are © {p.contributor.displayName}. If you authored this
          proposal and would like it removed, please file a request via{" "}
          <Link href="/disclosures" className="text-app-accent hover:underline">
            our removal flow
          </Link>
          . Removals are honored within 7 days.
        </p>
      </section>

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

function InfoCard({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-app-border bg-white p-5 shadow-card">
      <h2 className="font-mono text-[10px] uppercase tracking-wider text-app-muted">{heading}</h2>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="inline-flex items-center gap-2 text-app-muted">
        <span className="text-app-muted">{icon}</span>
        {label}
      </span>
      <span className="text-right font-medium text-app-ink">{value}</span>
    </div>
  );
}

function ProposalContextBody({
  p,
  relatedTechCount,
}: {
  p: import("@/lib/schema").Proposal;
  relatedTechCount: number;
}) {
  // Templated paragraphs that use real fields. NEVER fabricate.
  const tagText = p.techTags.length > 0
    ? p.techTags.map((s) => s.replace(/-/g, " ")).join(", ")
    : "no tech tags detected";

  return (
    <section className="mt-10 max-w-3xl text-base leading-relaxed text-app-ink/90">
      <h2 className="text-lg font-semibold text-app-ink">About this proposal</h2>
      <p className="mt-3">
        This is an accepted Google Summer of Code {p.year} proposal authored by{" "}
        <strong>{p.contributor.displayName}</strong> for{" "}
        <Link href={`/org/${p.orgSlug}`} className="text-app-accent hover:underline">
          {p.organization}
        </Link>
        . The PDF is{" "}
        <span className="font-mono">{formatPages(p.pdfPages)}</span> long
        {p.pdfSizeKB ? <span className="font-mono"> ({formatKB(p.pdfSizeKB)})</span> : null}.
      </p>
      {p.description && <p className="mt-3">{p.description}</p>}
      <p className="mt-3 text-app-muted">
        We curated this proposal from the{" "}
        <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="text-app-accent hover:underline">
          {p.sourceRepo}
        </a>{" "}
        community archive. {pluralize(relatedTechCount, "tech tag")} were detected automatically:{" "}
        <span className="font-mono">{tagText}</span>. Tech tags are derived by lexical match
        against a curated vocabulary — there is no AI involved.
      </p>
      <p className="mt-3 text-app-muted">
        GSoCDex is an independent reader for accepted GSoC proposals — built so applicants can
        learn from past work without navigating GitHub folders. We never store your email,
        we never run AI on this content, and we credit every source.
      </p>
    </section>
  );
}
