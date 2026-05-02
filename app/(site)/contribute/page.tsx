import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { SOURCE_REPOS } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contribute",
  description:
    "How to contribute proposals, fixes, and improvements to GSoCDex.",
  path: "/contribute",
});

export default function ContributePage() {
  return (
    <article className="container-content pb-24 pt-12 md:pt-16 prose-tips">
      <p className="label-caps">Contribute</p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight text-app-ink md:text-6xl">
        Help build the catalog.
      </h1>
      <p className="mt-3">
        GSoCDex is open-source and runs on community contributions. Here&apos;s how to help.
      </p>

      <h2>Submit your accepted proposal</h2>
      <p>
        If your GSoC proposal was accepted and isn&apos;t listed here yet, the easiest path is the{" "}
        <Link href="/submit">submission form</Link>. Owner reviews each submission, runs the
        ingest pipeline, and deploys.
      </p>

      <h2>Open a pull request</h2>
      <p>
        Bigger contributions — design improvements, new tips articles, accessibility fixes,
        better tech-tag detection — are best done as a GitHub PR. The repo lives at{" "}
        <a
          href="https://github.com/PankajKumardev/GsoCDex"
          target="_blank"
          rel="noreferrer"
        >
          github.com/PankajKumardev/GsoCDex
        </a>
        .
      </p>
      <ul>
        <li>
          <code>pnpm install</code>, then <code>pnpm ingest</code> to clone source archives
          and refresh <code>data/proposals.json</code>.
        </li>
        <li>
          <code>pnpm dev</code> for local development at <code>localhost:3000</code>.
        </li>
        <li>
          <code>pnpm verify</code> to run our content / trademark sweep before pushing.
        </li>
        <li>
          <code>pnpm build</code> to produce the production bundle.
        </li>
      </ul>

      <h2>Add a new source archive</h2>
      <p>
        We pull from these community archives today:
      </p>
      <ul>
        {SOURCE_REPOS.map((r) => (
          <li key={r.id}>
            <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
              {r.ownerRepo} <ArrowUpRight className="h-3 w-3" aria-hidden />
            </a>{" "}
            <span className="font-mono text-xs text-app-muted">— {r.layoutHint}</span>
          </li>
        ))}
      </ul>
      <p>
        If you maintain a similar archive with a permissive license (MIT, Apache, BSD, or
        CC-BY), open an issue and we&apos;ll add it to{" "}
        <code>lib/constants.ts → SOURCE_REPOS</code>. Each newly-added repo gets a license
        check on every ingest run.
      </p>

      <h2>What we do not accept</h2>
      <ul>
        <li>AI-generated proposals or content (we curate real, accepted proposals only).</li>
        <li>Commercial / referral content disguised as proposals.</li>
        <li>
          Newsletter widgets, email-collection forms, or any user-tracking code beyond the
          existing Vercel Analytics integration.
        </li>
      </ul>
    </article>
  );
}
