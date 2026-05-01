import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Disclosures",
  description: "Sponsorship, affiliate, trademark, and privacy disclosures for GSoCDex.",
  path: "/disclosures",
});

export default function DisclosuresPage() {
  return (
    <div className="container-content py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-app-ink md:text-3xl">Disclosures</h1>
      <p className="mt-4 text-app-muted">Comes online in P4.</p>
    </div>
  );
}
