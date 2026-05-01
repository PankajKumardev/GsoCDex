import { notFound } from "next/navigation";

import { getAllProposals, getProposalBySlugParts } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

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
  return buildMetadata({
    title: `${p.title} — ${p.organization} (${p.year})`,
    description:
      p.description ??
      `Accepted GSoC ${p.year} proposal by ${p.contributor.displayName} for ${p.organization}.`,
    path: `/p/${year}/${org}/${slug}`,
  });
}

export default async function ProposalPage({ params }: PageProps) {
  const { year, org, slug } = await params;
  const p = getProposalBySlugParts(year, org, slug);
  if (!p) notFound();
  return (
    <div className="container-wide py-12">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{p.title}</h1>
      <p className="mt-2 text-app-muted">
        {p.organization} · GSoC {p.year} · {p.contributor.displayName}
      </p>
      <p className="mt-4 text-app-muted">Proposal page lands in P3.</p>
    </div>
  );
}
