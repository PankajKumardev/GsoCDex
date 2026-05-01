import Link from "next/link";

import { OrgBadge } from "@/components/OrgBadge";
import { getAllOrgs } from "@/lib/data";
import { pluralize } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Organizations",
  description:
    "Every open-source organization with accepted Google Summer of Code proposals indexed on GSoCDex.",
  path: "/org",
});

export default function OrgIndexPage() {
  const orgs = getAllOrgs();
  // Group alphabetically.
  const groups = new Map<string, typeof orgs>();
  for (const o of orgs) {
    const letter = (o.name[0] ?? "?").toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : "#";
    const list = groups.get(key) ?? [];
    list.push(o);
    groups.set(key, list);
  }
  const letters = [...groups.keys()].sort();

  return (
    <div className="container-wide pb-24 pt-8">
      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-wider text-app-muted">
          GSoC mentor orgs
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app-ink md:text-5xl">
          Organizations
        </h1>
        <p className="mt-3 text-app-muted">
          {pluralize(orgs.length, "organization")} with at least one accepted proposal indexed.
        </p>
      </header>

      {/* Letter rail */}
      <nav aria-label="Jump to letter" className="mb-8 flex flex-wrap gap-2">
        {letters.map((l) => (
          <a
            key={l}
            href={`#${l}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-app-border bg-white font-mono text-xs text-app-ink hover:bg-app-surface"
          >
            {l}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-12">
        {letters.map((l) => (
          <section key={l} id={l}>
            <h2 className="mb-4 font-mono text-lg font-semibold text-app-muted">{l}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups.get(l)!.map((org) => (
                <Link
                  key={org.slug}
                  href={`/org/${org.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-app-border bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <OrgBadge name={org.name} slug={org.slug} logoUrl={org.logoUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-app-ink group-hover:text-app-accent">
                      {org.name}
                    </span>
                    <span className="block font-mono text-[11px] uppercase tracking-wider text-app-muted">
                      {pluralize(org.proposalCount, "proposal")} ·{" "}
                      {org.yearsParticipated.length} yr
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
