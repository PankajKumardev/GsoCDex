import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Browse all proposals",
  description: "Filter and browse accepted Google Summer of Code proposals by year, organization, technology, and project length.",
  path: "/browse",
});

export default function BrowsePage() {
  return (
    <div className="container-wide py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-app-ink md:text-3xl">All proposals</h1>
      <p className="mt-2 text-sm text-app-muted">The browse view comes online once data ingestion has run.</p>
    </div>
  );
}
