import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Submit a proposal",
  description: "Submitted a GSoC proposal? Add it to GSoCDex.",
  path: "/submit",
});

export default function SubmitPage() {
  return (
    <div className="container-content py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-app-ink md:text-3xl">Submit a proposal</h1>
      <p className="mt-4 text-app-muted">The submission form lands in P4.</p>
    </div>
  );
}
