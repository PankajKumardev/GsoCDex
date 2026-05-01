import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Organizations",
  description: "All open-source organizations with accepted GSoC proposals indexed on GSoCDex.",
  path: "/org",
});

export default function OrgIndexPage() {
  return (
    <div className="container-wide py-12">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Organizations</h1>
      <p className="mt-2 text-app-muted">Org index lands in P4.</p>
    </div>
  );
}
