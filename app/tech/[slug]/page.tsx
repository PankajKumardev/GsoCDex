import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { OrgBadge } from "@/components/OrgBadge";
import { ProposalCard } from "@/components/ProposalCard";
import {
  getAllOrgs,
  getAllTechTags,
  getProposalsByTech,
  getTechTagBySlug,
  getTopOrgsForTech,
} from "@/lib/data";
import { pluralize } from "@/lib/format";
import {
  breadcrumbJsonLd,
  buildMetadata,
  jsonLdScript,
  techJsonLd,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllTechTags().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const tech = getTechTagBySlug(slug);
  if (!tech) return buildMetadata({ title: "Tech tag", path: `/tech/${slug}` });
  const count = getProposalsByTech(slug).length;
  return buildMetadata({
    title: `${tech.label} GSoC proposals`,
    description: `${tech.description} ${pluralize(count, "accepted proposal")} indexed.`,
    path: `/tech/${slug}`,
  });
}

export default async function TechPage({ params }: PageProps) {
  const { slug } = await params;
  const tech = getTechTagBySlug(slug);
  if (!tech) notFound();

  const proposals = getProposalsByTech(slug);
  const techsBySlug = new Map(getAllTechTags().map((t) => [t.slug, t]));
  const orgsBySlug = new Map(getAllOrgs().map((o) => [o.slug, o]));
  const topOrgs = getTopOrgsForTech(slug, 6);

  return (
    <div className="container-ledger pb-24 pt-12 md:pt-16">
      <Breadcrumbs
        items={[
          { label: "GSoCDex", href: "/" },
          { label: "Tech", href: "/tech" },
          { label: tech.label },
        ]}
        className="mb-6"
      />

      <header>
        <p className="label-caps">§ {tech.category ?? "Tech"}</p>
        <h1 className="mt-2 max-w-3xl font-serif text-4xl tracking-tight text-app-ink md:text-6xl">
          Tagged with{" "}
          <span className="font-serif italic text-app-accent">{tech.label}</span>
        </h1>
      </header>

      <section className="mt-6 max-w-2xl text-base leading-relaxed text-app-ink/90">
        <p>{tech.description}</p>
        <p className="mt-3">
          {proposals.length === 0 ? (
            <>No proposals tagged with {tech.label} yet — but new ones get added with every ingest run.</>
          ) : (
            <>
              <span className="font-mono">{proposals.length}</span>{" "}
              accepted GSoC {pluralize(proposals.length, "proposal")} on GSoCDex {proposals.length === 1 ? "is" : "are"} tagged{" "}
              {tech.label}. Tags are detected automatically by lexical match against a curated
              vocabulary in <code className="font-mono">data/tech-tags.json</code> — there is no
              AI involved.
            </>
          )}
        </p>
        <p className="mt-3 text-app-muted">
          Tap any proposal to read it in-browser. The PDFs come from public community archives —
          original authors retain ownership.
        </p>
      </section>

      {topOrgs.length > 0 && (
        <section className="mt-10 rounded-2xl border border-app-border bg-app-surface p-5">
          <h2 className="font-mono text-[10px] uppercase tracking-wider text-app-muted">
            Top orgs using {tech.label}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {topOrgs.map(({ org, count }) => (
              <li key={org.slug} className="flex items-center gap-3">
                <OrgBadge name={org.name} slug={org.slug} logoUrl={org.logoUrl} size="sm" />
                <Link
                  href={`/org/${org.slug}`}
                  className="flex-1 truncate text-sm font-medium text-app-ink hover:text-app-accent"
                >
                  {org.name}
                </Link>
                <span className="font-mono text-xs text-app-muted">
                  {count} {count === 1 ? "proposal" : "proposals"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {proposals.length > 0 && (
        <section className="mt-10 grid gap-4 md:grid-cols-2">
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(techJsonLd(tech, proposals)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Tech", path: "/tech" },
              { name: tech.label, path: `/tech/${slug}` },
            ]),
          ),
        }}
      />
    </div>
  );
}
