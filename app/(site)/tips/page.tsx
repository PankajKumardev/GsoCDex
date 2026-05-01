import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tips for GSoC applicants",
  description: "Practical, opinionated guides for picking organizations, structuring your proposal, and communicating with mentors.",
  path: "/tips",
});

export default function TipsIndexPage() {
  return (
    <div className="container-content py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-app-ink md:text-3xl">Tips</h1>
      <p className="mt-2 text-sm text-app-muted">Articles will appear here once content has been written.</p>
    </div>
  );
}
