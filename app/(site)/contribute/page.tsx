import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contribute",
  description: "How to contribute proposals, fixes, and improvements to GSoCDex.",
  path: "/contribute",
});

export default function ContributePage() {
  return (
    <div className="container-content py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-app-ink md:text-3xl">Contribute</h1>
      <p className="mt-4 text-app-muted">Coming online in P4.</p>
    </div>
  );
}
