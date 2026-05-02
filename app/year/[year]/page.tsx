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
    <div className="container-ledger pb-24 pt-12 md:pt-16">
      <Breadcrumbs
        items={[
          { label: "GSoCDex", href: "/" },
          { label: `${yearNum}` },
        ]}
        className="mb-6 font-sans text-xs uppercase tracking-[0.22em]"
      />

      <header>
        <p className="label-caps">Year archive</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-app-ink md:text-7xl">
          GSoC <span className="font-mono text-app-accent">{yearNum}</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-app-muted">
          <span className="font-mono text-app-ink">{proposals.length}</span> accepted{" "}
          {proposals.length === 1 ? "proposal" : "proposals"} from{" "}
          <span className="font-mono text-app-ink">{orgsThisYear.size}</span>{" "}
          {orgsThisYear.size === 1 ? "organization" : "organizations"} —{" "}
          <span className="font-mono text-app-ink">{contributorsThisYear.size}</span>{" "}
          {contributorsThisYear.size === 1 ? "contributor" : "contributors"}.
        </p>
      </header>

      <div className="mt-6">
        <SponsorSlot variant="inline" seed={`year-${yearNum}`} />
      </div>

      {proposals.length === 0 ? (
        <p className="text-app-muted">No proposals indexed for this year yet.</p>
      ) : (
        <section className="mt-6 grid gap-4 md:grid-cols-2">
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
