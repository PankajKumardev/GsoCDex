import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About GSoCDex",
  description:
    "GSoCDex is an independent community archive of accepted Google Summer of Code proposals.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="container-content py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-app-ink md:text-3xl">About</h1>
      <p className="mt-4 text-app-muted">
        GSoCDex is an independent community archive of accepted Google Summer of Code proposals.
        Full content, source repo attributions, and the trademark notice land in P4.
      </p>
    </div>
  );
}
