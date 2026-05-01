import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SponsorSlot } from "@/components/SponsorSlot";
import { getAllTips, getTipBySlug } from "@/lib/data";
import { breadcrumbJsonLd, buildMetadata, jsonLdScript, tipArticleJsonLd } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllTips().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const tip = getTipBySlug(slug);
  if (!tip) return buildMetadata({ title: "Tip", path: `/tips/${slug}` });
  return buildMetadata({
    title: tip.frontmatter.title,
    description: tip.frontmatter.summary,
    path: `/tips/${slug}`,
  });
}

const MDX_COMPONENTS = {
  a: ({ href, children, ...rest }: React.ComponentProps<"a">) => {
    if (href?.startsWith("/")) {
      return (
        <Link href={href} {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  },
};

export default async function TipPage({ params }: PageProps) {
  const { slug } = await params;
  const tip = getTipBySlug(slug);
  if (!tip) notFound();

  const allTips = getAllTips().filter((t) => t.slug !== slug);
  const related = allTips
    .map((t) => ({
      tip: t,
      score: tip.frontmatter.tags.filter((g) => t.frontmatter.tags.includes(g)).length,
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.tip);
  const fallback = related.length > 0 ? related : allTips.slice(0, 3);

  const lastUpdated = new Date(tip.frontmatter.lastUpdated).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="container-content pb-24 pt-8">
      <Breadcrumbs
        items={[
          { label: "GSoCDex", href: "/" },
          { label: "Tips", href: "/tips" },
          { label: tip.frontmatter.title },
        ]}
        className="mb-4"
      />

      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-wider text-app-muted">
          {lastUpdated} · {tip.frontmatter.author}
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight text-app-ink md:text-4xl lg:text-5xl">
          {tip.frontmatter.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-app-muted md:text-lg">
          {tip.frontmatter.summary}
        </p>
        {tip.frontmatter.sponsored && tip.frontmatter.sponsorName && (
          <p className="mt-4 rounded-lg border border-app-border bg-app-surface px-4 py-2 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-wider text-app-muted">
              Sponsored ·{" "}
            </span>
            <span>
              This article is sponsored by <strong>{tip.frontmatter.sponsorName}</strong>. We only
              accept sponsors whose offering is genuinely useful to GSoC applicants.
            </span>
          </p>
        )}
      </header>

      <div className="prose-tips">
        <MDXRemote source={tip.content} components={MDX_COMPONENTS} />
      </div>

      <SponsorSlot variant="inline" seed={`tip-${slug}`} />

      {fallback.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-semibold text-app-ink">Related tips</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {fallback.map((t) => (
              <Link
                key={t.slug}
                href={`/tips/${t.slug}`}
                className="group rounded-2xl border border-app-border bg-white p-5 shadow-card hover:shadow-card-hover"
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-app-muted">
                  {new Date(t.frontmatter.lastUpdated).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <h3 className="mt-1.5 text-base font-semibold leading-snug text-app-ink group-hover:text-app-accent">
                  {t.frontmatter.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-app-muted">{t.frontmatter.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(tipArticleJsonLd(tip)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Tips", path: "/tips" },
              { name: tip.frontmatter.title, path: `/tips/${slug}` },
            ]),
          ),
        }}
      />
    </article>
  );
}
