import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProposalCard } from "@/components/ProposalCard";
import { SponsorSlot } from "@/components/SponsorSlot";
import {
  getAllOrgs,
  getAllTechTags,
  getProposalsByYear,
  getYearsCovered,
} from "@/lib/data";
import { pluralize } from "@/lib/format";
import {
  breadcrumbJsonLd,
  buildMetadata,
  itemListJsonLd,
  jsonLdScript,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ year: string }>;
}

export function generateStaticParams() {
  return getYearsCovered().map((y) => ({ year: String(y) }));
}

export async function generateMetadata({ params }: PageProps) {
  const { year } = await params;
  const yearNum = Number.parseInt(year, 10);
  const proposals = Number.isNaN(yearNum) ? [] : getProposalsByYear(yearNum);
  return buildMetadata({
    title: `GSoC ${yearNum} — accepted proposals`,
    description: `Read all ${proposals.length} accepted Google Summer of Code ${yearNum} proposals indexed on GSoCDex. Filter by organization and technology.`,
    path: `/year/${yearNum}`,
  });
}

export default async function YearPage({ params }: PageProps) {
  const { year } = await params;
  const yearNum = Number.parseInt(year, 10);
  if (Number.isNaN(yearNum) || !getYearsCovered().includes(yearNum)) notFound();

  const proposals = getProposalsByYear(yearNum);
  const techsBySlug = new Map(getAllTechTags().map((t) => [t.slug, t]));
  const orgsBySlug = new Map(getAllOrgs().map((o) => [o.slug, o]));

  const orgsThisYear = new Set(proposals.map((p) => p.orgSlug));
  const contributorsThisYear = new Set(proposals.map((p) => p.contributor.displayName));

  return (
    <div className="container-content pb-24 pt-8">
      <Breadcrumbs
        items={[
          { label: "GSoCDex", href: "/" },
          { label: `${yearNum}` },
        ]}
        className="mb-4"
      />

      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-app-muted">
          Year archive
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app-ink md:text-5xl">
          GSoC {yearNum}
        </h1>
        <p className="mt-3 text-base text-app-muted">
          {pluralize(proposals.length, "accepted proposal")} from{" "}
          <span className="font-mono text-app-ink">{orgsThisYear.size}</span>{" "}
          {pluralize(orgsThisYear.size, "organization")} —{" "}
          <span className="font-mono text-app-ink">{contributorsThisYear.size}</span>{" "}
          {pluralize(contributorsThisYear.size, "contributor")}.
        </p>
      </header>

      <div className="mt-6">
        <SponsorSlot variant="inline" seed={`year-${yearNum}`} />
      </div>

      {proposals.length === 0 ? (
        <p className="text-app-muted">No proposals indexed for this year yet.</p>
      ) : (
        <section className="mt-6 flex flex-col gap-4">
          {proposals.map((p) => (
            <ProposalCard
              key={p.slug}
              proposal={p}
              org={orgsBySlug.get(p.orgSlug)}
              techTagsBySlug={techsBySlug}
            />
          ))}
        </section>
      )}

      <div className="mt-12 text-center">
        <Link
          href="/browse"
          className="inline-flex items-center justify-center rounded-lg border border-app-border bg-white px-5 py-3 text-sm font-medium text-app-ink shadow-sm hover:bg-app-surface"
        >
          Browse all years →
        </Link>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(itemListJsonLd(`Accepted GSoC ${yearNum} proposals`, proposals)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: `GSoC ${yearNum}`, path: `/year/${yearNum}` },
            ]),
          ),
        }}
      />
    </div>
  );
}
