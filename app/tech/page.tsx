import Link from "next/link";

import { getAllProposals, getAllTechTags } from "@/lib/data";
import { pluralize } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tech tags",
  description:
    "Browse Google Summer of Code proposals by programming language, framework, and domain.",
  path: "/tech",
});

export default function TechIndexPage() {
  const tags = getAllTechTags();
  const proposals = getAllProposals();
  const counts = new Map<string, number>();
  for (const p of proposals) {
    for (const t of p.techTags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  const grouped = new Map<string, typeof tags>();
  for (const t of tags) {
    const key = t.category ?? "other";
    const list = grouped.get(key) ?? [];
    list.push(t);
    grouped.set(key, list);
  }

  return (
    <div className="container-ledger pb-24 pt-12 md:pt-16">
      <header className="mb-12">
        <p className="label-caps">Curated vocabulary</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-app-ink md:text-7xl">
          Tech tags
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-app-muted">
          {pluralize(tags.length, "tag")} we use to classify GSoC proposals. Tap a tag to find
          relevant proposals.
        </p>
      </header>

      <div className="flex flex-col gap-12">
        {[...grouped.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([cat, list]) => (
            <section key={cat}>
              <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-app-muted">
                § {cat}
              </h2>
              <div className="flex flex-wrap gap-2">
                {list
                  .slice()
                  .sort((a, b) => (counts.get(b.slug) ?? 0) - (counts.get(a.slug) ?? 0))
                  .map((t) => (
                    <Link
                      key={t.slug}
                      href={`/tech/${t.slug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-surface-elevated px-4 py-1.5 font-mono text-xs uppercase tracking-[0.16em] text-app-ink shadow-card transition-all hover:border-app-accent/30 hover:bg-app-accent-soft hover:text-app-accent"
                    >
                      {t.label}
                      <span className="font-mono text-[10px] text-app-muted">
                        [{counts.get(t.slug) ?? 0}]
                      </span>
                    </Link>
                  ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
