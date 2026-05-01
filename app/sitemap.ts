import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/constants";
import {
  getAllOrgs,
  getAllProposals,
  getAllTechTags,
  getAllTips,
  getYearsCovered,
} from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  const staticPaths: Array<{ path: string; priority?: number }> = [
    { path: "/", priority: 1 },
    { path: "/browse", priority: 0.9 },
    { path: "/tips", priority: 0.7 },
    { path: "/submit", priority: 0.5 },
    { path: "/about", priority: 0.5 },
    { path: "/contribute", priority: 0.4 },
    { path: "/disclosures", priority: 0.3 },
    { path: "/org", priority: 0.7 },
    { path: "/tech", priority: 0.7 },
  ];
  for (const { path, priority } of staticPaths) {
    entries.push({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority,
    });
  }

  for (const y of getYearsCovered()) {
    entries.push({
      url: `${SITE_URL}/year/${y}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const org of getAllOrgs()) {
    entries.push({
      url: `${SITE_URL}/org/${org.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  for (const tech of getAllTechTags()) {
    entries.push({
      url: `${SITE_URL}/tech/${tech.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  for (const p of getAllProposals()) {
    entries.push({
      url: `${SITE_URL}/p/${p.year}/${p.orgSlug}/${p.slug}`,
      lastModified: p.addedAt ? new Date(p.addedAt) : now,
      changeFrequency: "yearly",
      priority: 0.6,
    });
  }

  for (const tip of getAllTips()) {
    entries.push({
      url: `${SITE_URL}/tips/${tip.slug}`,
      lastModified: new Date(tip.frontmatter.lastUpdated),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
