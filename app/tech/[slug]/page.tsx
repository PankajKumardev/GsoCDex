import { notFound } from "next/navigation";

import { getAllTechTags, getTechTagBySlug } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

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
  return buildMetadata({
    title: `${tech.label} — GSoC proposals`,
    description: tech.description,
    path: `/tech/${slug}`,
  });
}

export default async function TechPage({ params }: PageProps) {
  const { slug } = await params;
  const tech = getTechTagBySlug(slug);
  if (!tech) notFound();
  return (
    <div className="container-wide py-12">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Proposals tagged with {tech.label}
      </h1>
      <p className="mt-2 text-app-muted">Tech page lands in P4.</p>
    </div>
  );
}
