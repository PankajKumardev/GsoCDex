import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tech tags",
  description: "Browse Google Summer of Code proposals by programming language, framework, and domain.",
  path: "/tech",
});

export default function TechIndexPage() {
  return (
    <div className="container-wide py-12">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Tech tags</h1>
      <p className="mt-2 text-app-muted">Tech tag index lands in P4.</p>
    </div>
  );
}
