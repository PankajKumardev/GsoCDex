import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { getAllTips } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tips for GSoC applicants",
  description:
    "Practical, opinionated guides for picking GSoC organizations, structuring your proposal, and communicating with mentors.",
  path: "/tips",
});

export default function TipsIndexPage() {
  const tips = getAllTips();
  return (
    <div className="container-content pb-24 pt-8">
      <header className="mb-10">
        <p className="font-mono text-[11px] uppercase tracking-wider text-app-muted">
          Editorial
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app-ink md:text-5xl">
          Tips for applicants
        </h1>
        <p className="mt-3 text-app-muted">
          Practical, opinionated guides we wish someone had handed us before our first GSoC
          application. No fluff.
        </p>
      </header>

      {tips.length === 0 ? (
        <p className="text-app-muted">No tips published yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-app-border">
          {tips.map((tip) => (
            <li key={tip.slug} className="py-6 first:pt-0 last:pb-0">
              <Link
                href={`/tips/${tip.slug}`}
                className="group flex flex-col gap-2 rounded-2xl"
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-app-muted">
                  {new Date(tip.frontmatter.lastUpdated).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <h2 className="text-xl font-semibold leading-snug text-app-ink group-hover:text-app-accent md:text-2xl">
                  {tip.frontmatter.title}
                </h2>
                <p className="text-base leading-relaxed text-app-muted">
                  {tip.frontmatter.summary}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-app-accent">
                  Read <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
