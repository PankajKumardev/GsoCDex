import { notFound } from "next/navigation";

import { getYearsCovered } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

interface PageProps {
  params: Promise<{ year: string }>;
}

export function generateStaticParams() {
  return getYearsCovered().map((y) => ({ year: String(y) }));
}

export async function generateMetadata({ params }: PageProps) {
  const { year } = await params;
  return buildMetadata({
    title: `GSoC ${year}`,
    description: `All accepted Google Summer of Code proposals from ${year}.`,
    path: `/year/${year}`,
  });
}

export default async function YearPage({ params }: PageProps) {
  const { year } = await params;
  const yearNum = Number.parseInt(year, 10);
  if (Number.isNaN(yearNum) || !getYearsCovered().includes(yearNum)) notFound();
  return (
    <div className="container-wide py-12">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">GSoC {yearNum}</h1>
      <p className="mt-2 text-app-muted">Year page lands in P4.</p>
    </div>
  );
}
