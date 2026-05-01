import Link from "next/link";

import { TrademarkNotice } from "@/components/TrademarkNotice";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Disclosures",
  description:
    "Sponsorship, affiliate, trademark, privacy, and removal policies for GSoCDex.",
  path: "/disclosures",
});

export default function DisclosuresPage() {
  const tallyId = process.env.NEXT_PUBLIC_TALLY_REMOVAL_FORM_ID ?? "";
  const removalUrl = tallyId ? `https://tally.so/r/${tallyId}` : null;
  return (
    <article className="container-content pb-24 pt-8 prose-tips">
      <p className="font-mono text-[11px] uppercase tracking-wider text-app-muted">Legal</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app-ink md:text-4xl">
        Disclosures
      </h1>
      <p className="mt-3">
        We try to be a trustworthy source for GSoC applicants. That means clear policies on
        money, content licensing, and your data.
      </p>

      <h2>Sponsorship policy</h2>
      <p>
        GSoCDex accepts sponsorships from companies whose offering is genuinely useful to GSoC
        applicants — primarily developer tools, cloud providers, and student-credit programs.
        Every sponsored slot is clearly labeled <strong>Sponsored</strong> in monospaced micro-text,
        per FTC guidelines. Sponsorship has no influence on which proposals or organizations we
        feature: editorial decisions are made independently of who&apos;s paying.
      </p>
      <p>
        We do not run sponsorships in the body of any individual proposal — only on category
        pages, the homepage, and inside the PDF reader (sticky bottom strip).
      </p>

      <h2>Affiliate disclosure</h2>
      <p>
        Some links on GSoCDex (notably to cloud / developer-tool partners) are affiliate links.
        If you sign up via one of them, we may receive a small referral fee at no cost to you.
        Affiliate-linked items are clearly labeled and editorially chosen — we only recommend
        services we&apos;d use ourselves.
      </p>

      <h2>Trademark notice</h2>
      <TrademarkNotice variant="full" />
      <p>
        We use the term &quot;GSoC&quot; descriptively (nominative use) — to identify the
        program our content is about. We do not use Google&apos;s logos, four-color motif, or
        product imagery in our branding. Our accent colour is{" "}
        <code className="font-mono">#2563EB</code> (Tailwind blue-600), which is intentionally
        adjacent to but distinct from Google Blue.
      </p>

      <h2>Author rights &amp; removal</h2>
      <p>
        Every proposal on GSoCDex was originally shared in a public, permissively-licensed
        community archive. We credit the original author on every proposal page and link back
        to the source repository. If you authored a proposal indexed here and would like it
        removed, file a request below — we honor removals within <strong>7 days</strong>.
      </p>
      <p>
        If a source repository is taken down or relicensed restrictively, we will remove all
        proposals from that source within <strong>14 days</strong>.
      </p>
      {removalUrl ? (
        <p>
          <a
            href={removalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-app-accent px-4 py-2 text-sm font-medium text-white"
          >
            Open removal-request form
          </a>
        </p>
      ) : (
        <p className="rounded-lg border border-app-border bg-app-surface p-4 text-sm">
          Removal-request form not configured yet. In the meantime, please open a GitHub
          issue at{" "}
          <a
            href="https://github.com/PankajKumardev/GsoCDex/issues"
            target="_blank"
            rel="noreferrer"
            className="text-app-accent"
          >
            github.com/PankajKumardev/GsoCDex
          </a>{" "}
          and we will action removals within 7 days.
        </p>
      )}

      <h2>Privacy</h2>
      <p>
        We collect <strong>anonymous Vercel Analytics</strong> events (page views, country,
        browser). That&apos;s all. No cookies beyond what Vercel Analytics sets. No
        third-party trackers. No advertising networks. <strong>No email or signup forms</strong>{" "}
        anywhere on the site — we do not have a newsletter and do not plan to start one.
      </p>

      <h2>Reporting an issue</h2>
      <p>
        Found inaccurate metadata, a broken PDF, or content that should not be here?{" "}
        <Link href="/contribute" className="text-app-accent">
          Contact us
        </Link>
        . We aim to respond within 3 business days.
      </p>
    </article>
  );
}
