import { notFound } from "next/navigation";

import { getAllOrgs, getOrgBySlug } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

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
  return buildMetadata({
    title: `${org.name} — GSoC proposals`,
    description: `Accepted Google Summer of Code proposals from ${org.name}.`,
    path: `/org/${slug}`,
  });
}

export default async function OrgPage({ params }: PageProps) {
  const { slug } = await params;
  const org = getOrgBySlug(slug);
  if (!org) notFound();
  return (
    <div className="container-wide py-12">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{org.name}</h1>
      <p className="mt-2 text-app-muted">Org page lands in P4.</p>
    </div>
  );
}
