import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-content flex min-h-[60vh] flex-col items-center justify-center pb-24 pt-16 text-center">
      <p className="font-mono text-[11px] uppercase tracking-wider text-app-muted">404</p>
      <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-app-ink md:text-5xl">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-3 max-w-md text-app-muted">
        It may have been moved, removed at the original author&apos;s request, or never existed.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-app-accent px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-app-accent-hover"
        >
          Back to homepage
        </Link>
        <Link
          href="/browse"
          className="inline-flex items-center justify-center rounded-lg border border-app-border bg-white px-5 py-3 text-sm font-medium text-app-ink shadow-sm hover:bg-app-surface"
        >
          Browse all proposals
        </Link>
      </div>
    </div>
  );
}
