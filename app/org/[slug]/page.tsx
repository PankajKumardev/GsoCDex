import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { OrgBadge } from "@/components/OrgBadge";
import { ProposalCard } from "@/components/ProposalCard";
import { SponsorSlot } from "@/components/SponsorSlot";
import {
  getAllOrgs,
  getAllTechTags,
  getOrgBySlug,
  getProposalsByOrg,
} from "@/lib/data";
import { pluralize } from "@/lib/format";
import {
  breadcrumbJsonLd,
  buildMetadata,
  jsonLdScript,
  organizationJsonLd,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllOrgs().map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const org = getOrgBySlug(slug);
  if (!org) return buildMetadata({ title: "Organization", path: `/org/${slug}` });
  const description =
    org.description ??
    `${org.name} accepted ${pluralize(org.proposalCount, "GSoC proposal")} across ${org.yearsParticipated.length} ${org.yearsParticipated.length === 1 ? "year" : "years"}. Read every accepted proposal in your browser on GSoCDex.`;
  return buildMetadata({
    title: `${org.name} — accepted GSoC proposals`,
    description,
    path: `/org/${slug}`,
  });
}

export default async function OrgPage({ params }: PageProps) {
  const { slug } = await params;
  const org = getOrgBySlug(slug);
  if (!org) notFound();

  const proposals = getProposalsByOrg(slug);
  const techsBySlug = new Map(getAllTechTags().map((t) => [t.slug, t]));
  const orgsBySlug = new Map(getAllOrgs().map((o) => [o.slug, o]));

  const techCounts = new Map<string, number>();
  for (const p of proposals) {
    for (const t of p.techTags) techCounts.set(t, (techCounts.get(t) ?? 0) + 1);
  }
  const topTechs = [...techCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([s]) => techsBySlug.get(s))
    .filter((t): t is import("@/lib/schema").TechTag => !!t);

  return (
    <div className="container-ledger pb-24 pt-12 md:pt-16">
      <Breadcrumbs
        items={[
          { label: "GSoCDex", href: "/" },
          { label: "Orgs", href: "/org" },
          { label: org.name },
        ]}
        className="mb-6"
      />

      <header className="flex flex-col items-start gap-5 md:flex-row md:items-center md:gap-7">
        <OrgBadge name={org.name} slug={org.slug} logoUrl={org.logoUrl} size="lg" />
        <div className="flex-1">
          <p className="label-caps">Mentor organization</p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight text-app-ink md:text-6xl">
            {org.name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-app-muted">
            <span className="rounded-full bg-app-surface px-3 py-1 font-mono text-xs uppercase tracking-wider">
              {pluralize(proposals.length, "proposal")}
            </span>
            <span className="rounded-full bg-app-surface px-3 py-1 font-mono text-xs uppercase tracking-wider">
              {pluralize(org.yearsParticipated.length, "year")}
            </span>
            {org.beginnerFriendly && (
              <span className="rounded-md bg-status-beginner px-2.5 py-1 text-xs font-medium text-status-beginner-text">
                Beginner-friendly
              </span>
            )}
            {org.category && (
              <span className="rounded-full bg-app-surface px-3 py-1 text-xs font-medium text-app-ink">
                {org.category}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* SEO body — ≥300 words target */}
      <section className="mt-8 max-w-2xl text-base leading-relaxed text-app-ink/90">
        {org.description ? (
          <p>{org.description}</p>
        ) : (
          <p>
            <strong>{org.name}</strong> is a Google Summer of Code mentor organization with{" "}
            {pluralize(proposals.length, "accepted proposal")} indexed on GSoCDex across{" "}
            {pluralize(org.yearsParticipated.length, "year")}. We curated every PDF on this page
            from the public community archive linked on each proposal — original authors retain
            full ownership of their proposals.
          </p>
        )}
        {org.yearsParticipated.length > 0 && (
          <p className="mt-3">
            {org.name} has participated in{" "}
            {org.yearsParticipated
              .slice()
              .sort()
              .map((y) => (
                <Link
                  key={y}
                  href={`/year/${y}`}
                  className="font-mono text-app-accent hover:underline"
                >
                  {y}
                </Link>
              ))
              .reduce<React.ReactNode[]>(
                (acc, el, i, arr) =>
                  acc.concat(i < arr.length - 1 ? [el, ", "] : [el]),
                [],
              )}
            . Each year-page lists proposals from across all participating orgs.
          </p>
        )}
        {topTechs.length > 0 && (
          <p className="mt-3">
            Most-used technologies in {org.name} GSoC proposals:{" "}
            {topTechs.map((t, i) => (
              <span key={t.slug}>
                {i > 0 ? ", " : ""}
                <Link href={`/tech/${t.slug}`} className="text-app-accent hover:underline">
                  {t.label}
                </Link>
              </span>
            ))}
            .
          </p>
        )}
        {org.websiteUrl && (
          <p className="mt-3">
            <a
              href={org.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-app-accent hover:underline"
            >
              {org.name} website <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </p>
        )}
        <p className="mt-3 text-app-muted">
          Tap any proposal below to read it in-browser. The {pluralize(proposals.length, "proposal")}{" "}
          on this page are exclusively the accepted ones we have permission to redistribute via
          permissive open-source licenses on the source archives.
        </p>
      </section>

      <div className="mt-8">
        <SponsorSlot variant="inline" seed={`org-${slug}`} />
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {proposals.map((p) => (
          <ProposalCard
            key={p.slug}
            proposal={p}
            org={orgsBySlug.get(p.orgSlug)}
            techTagsBySlug={techsBySlug}
          />
        ))}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd(org, proposals)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Orgs", path: "/org" },
              { name: org.name, path: `/org/${slug}` },
            ]),
          ),
        }}
      />
    </div>
  );
}
