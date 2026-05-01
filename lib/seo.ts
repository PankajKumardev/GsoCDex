import type { Metadata } from "next";

import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, TWITTER_HANDLE } from "@/lib/constants";
import type { Organization, Proposal, TechTag, Tip } from "@/lib/schema";

export interface BuildMetadataOptions {
  title: string;
  description?: string;
  path: string;
  /** Optional override for OG image path (must be absolute or root-relative). */
  image?: string;
  noIndex?: boolean;
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function ogImageUrl(params: {
  title: string;
  subtitle?: string;
  kind?: "home" | "proposal" | "org" | "tech" | "tip" | "year";
}): string {
  const sp = new URLSearchParams();
  sp.set("title", params.title);
  if (params.subtitle) sp.set("subtitle", params.subtitle);
  if (params.kind) sp.set("kind", params.kind);
  return `${SITE_URL}/api/og?${sp.toString()}`;
}

export function buildMetadata(opts: BuildMetadataOptions): Metadata {
  const description = opts.description ?? SITE_DESCRIPTION;
  const url = absoluteUrl(opts.path);
  const image = opts.image
    ? absoluteUrl(opts.image)
    : opts.path === "/"
      ? ogImageUrl({ title: SITE_NAME, subtitle: "Every accepted GSoC proposal, browsable.", kind: "home" })
      : ogImageUrl({ title: opts.title, subtitle: SITE_NAME });

  return {
    title: opts.title,
    description,
    alternates: { canonical: url },
    robots: opts.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: opts.title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: opts.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description,
      images: [image],
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },
  };
}

// ---- JSON-LD builders ----

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  } as const;
}

export function articleJsonLd(p: Proposal) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    author: { "@type": "Person", name: p.contributor.displayName },
    datePublished: `${p.year}-08-01`,
    dateModified: p.addedAt,
    mainEntityOfPage: absoluteUrl(`/p/${p.year}/${p.orgSlug}/${p.slug}`),
    image: ogImageUrl({ title: p.title, subtitle: `${p.organization} · GSoC ${p.year}`, kind: "proposal" }),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    keywords: p.techTags.join(", "),
  } as const;
}

export function organizationJsonLd(org: Organization, proposals: Proposal[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    description: org.description,
    url: org.websiteUrl,
    sameAs: org.websiteUrl ? [org.websiteUrl] : undefined,
    subjectOf: {
      "@type": "ItemList",
      name: `Accepted GSoC proposals from ${org.name}`,
      numberOfItems: proposals.length,
      itemListElement: proposals.slice(0, 25).map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: absoluteUrl(`/p/${p.year}/${p.orgSlug}/${p.slug}`),
        name: p.title,
      })),
    },
  } as const;
}

export function itemListJsonLd(name: string, proposals: Proposal[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: proposals.length,
    itemListElement: proposals.slice(0, 50).map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: absoluteUrl(`/p/${p.year}/${p.orgSlug}/${p.slug}`),
      name: p.title,
    })),
  } as const;
}

export function techJsonLd(tech: TechTag, proposals: Proposal[]) {
  return itemListJsonLd(`Accepted GSoC proposals tagged with ${tech.label}`, proposals);
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/browse?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  } as const;
}

export function tipArticleJsonLd(tip: Tip) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: tip.frontmatter.title,
    author: { "@type": "Person", name: tip.frontmatter.author },
    datePublished: tip.frontmatter.lastUpdated,
    dateModified: tip.frontmatter.lastUpdated,
    mainEntityOfPage: absoluteUrl(`/tips/${tip.slug}`),
    image: ogImageUrl({ title: tip.frontmatter.title, subtitle: SITE_NAME, kind: "tip" }),
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    description: tip.frontmatter.summary,
  } as const;
}

export function jsonLdScript(value: unknown): string {
  // Escape `</` to prevent script-tag injection in inlined JSON-LD blocks.
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
