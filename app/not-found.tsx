import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-content flex min-h-[60vh] flex-col items-center justify-center pb-24 pt-16 text-center">
      <p className="label-caps">404</p>
      <h1 className="mt-3 max-w-2xl text-balance font-serif text-4xl tracking-tight text-app-ink md:text-6xl">
        We couldn&apos;t find{" "}
        <span className="font-serif italic text-app-accent">that page.</span>
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-app-muted">
        It may have been moved, removed at the original author&apos;s request, or never existed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-app-accent px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-white shadow-card hover:bg-app-accent-hover"
        >
          Back to homepage
        </Link>
        <Link
          href="/browse"
          className="inline-flex items-center justify-center rounded-full border border-app-border bg-app-surface-elevated px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-app-ink shadow-card hover:bg-app-bg"
        >
          Browse all
        </Link>
      </div>
    </div>
  );
}
