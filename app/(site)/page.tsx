import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "GSoCDex — Every accepted GSoC proposal, browsable.",
  description:
    "Browse and read accepted Google Summer of Code proposals from across the years. Curated from open community archives. Free, fast, no signup.",
  path: "/",
});

export default function HomePage() {
  return (
    <div className="container-wide pb-24 pt-12 md:pt-16">
      <section className="mx-auto max-w-3xl pt-8 text-center md:pt-16">
        <p className="font-mono text-[11px] uppercase tracking-wider text-app-muted">
          The GSoC proposal archive
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-app-ink md:text-5xl lg:text-6xl">
          Every accepted GSoC proposal, browsable.
        </h1>
        <p className="mt-5 text-base text-app-muted md:text-lg">
          A clean, mobile-first archive of accepted Google Summer of Code proposals — curated from open community
          archives. No signup, no clutter. Just proposals you can actually read.
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-2xl rounded-2xl border border-app-border bg-app-surface p-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wider text-app-muted">
          Bootstrap phase
        </p>
        <h2 className="mt-2 text-lg font-semibold text-app-ink">
          The proposal feed lights up after the first ingest run.
        </h2>
        <p className="mt-2 text-sm text-app-muted">
          Run <code className="rounded border border-app-border bg-white px-1.5 py-0.5 font-mono text-xs">pnpm ingest</code>{" "}
          to pull from community source repos.
        </p>
      </section>
    </div>
  );
}
