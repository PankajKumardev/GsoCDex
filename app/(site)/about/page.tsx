import Link from "next/link";

import { TrademarkNotice } from "@/components/TrademarkNotice";
import { SOURCE_REPOS } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description:
    "GSoCDex is an independent community archive of accepted Google Summer of Code proposals.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <article className="container-content pb-24 pt-12 md:pt-16 prose-tips">
      <p className="label-caps">About</p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight text-app-ink md:text-6xl">
        We made it easy to read{" "}
        <span className="font-serif italic text-app-accent">GSoC proposals.</span>
      </h1>
      <p className="mt-3">
        <strong>GSoCDex</strong> is an independent, community-curated archive of accepted Google
        Summer of Code proposals. Every PDF on this site was originally shared in a public
        GitHub archive maintained by GSoC alumni and contributors. We index it, give it a
        clean reading experience, and link it back to the source.
      </p>

      <h2>Why we built it</h2>
      <p>
        If you&apos;re applying to GSoC, the most useful thing you can do is read accepted
        proposals from past years. The community has already collected hundreds of them — but
        navigating GitHub folder trees on a phone is painful. GSoCDex fixes that:
      </p>
      <ul>
        <li>One mobile-first reader, no GitHub folder browsing.</li>
        <li>Search by title, contributor, organization, technology — all instant, all client-side.</li>
        <li>In-browser PDF preview, so you can flip through 30 proposals in 30 minutes.</li>
        <li>No signup, no email collection, no ads on proposal content.</li>
      </ul>

      <h2>What this is not</h2>
      <p>
        GSoCDex is not affiliated with Google or the GSoC program. We don&apos;t write
        proposals — we curate existing ones. We don&apos;t use AI on this content. We
        don&apos;t collect emails. We don&apos;t store any personal data beyond anonymous page
        analytics.
      </p>

      <h2>Thanks &amp; attribution</h2>
      <p>
        Every proposal indexed on GSoCDex was originally collected by community archive
        maintainers under permissive open-source licenses. We are deeply grateful to:
      </p>
      <ul>
        {SOURCE_REPOS.map((r) => (
          <li key={r.id}>
            <a href={r.url} target="_blank" rel="noreferrer">
              <strong>{r.owner}</strong> — {r.ownerRepo}
            </a>
            : {r.layoutHint}
          </li>
        ))}
      </ul>
      <p>
        If you maintain a similar archive and would like it indexed here, please{" "}
        <Link href="/contribute">open a contribution</Link> or email us via the{" "}
        <Link href="/disclosures">disclosures page</Link>.
      </p>

      <h2>Are you the author of one of these proposals?</h2>
      <p>
        Every proposal page credits the original author by name and links back to the source
        archive. If you authored a proposal indexed here and would like it removed, please
        file a request through our removal flow on the{" "}
        <Link href="/disclosures">disclosures page</Link>. Removals are honored within 7 days.
      </p>

      <h2 id="trademark">Trademark notice</h2>
      <TrademarkNotice variant="full" />

      <p className="mt-12 text-sm text-app-muted">
        Built with ❤ by the GSoCDex community. Source code on{" "}
        <a
          href="https://github.com/PankajKumardev/GsoCDex"
          target="_blank"
          rel="noreferrer"
          className="text-app-accent"
        >
          GitHub
        </a>
        .
      </p>
    </article>
  );
}
