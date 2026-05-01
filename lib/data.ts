/**
 * Centralized data accessors. All `data/*.json` reads happen through here,
 * with zod validation at first access. Cached at module scope so each
 * static page render reuses the parsed objects.
 */

import "server-only";

import proposalsRaw from "@/data/proposals.json";
import orgsRaw from "@/data/orgs.json";
import techTagsRaw from "@/data/tech-tags.json";

import {
  type Organization,
  OrganizationSchema,
  type Proposal,
  ProposalSchema,
  type TechTag,
  TechTagSchema,
  type Tip,
  TipFrontmatterSchema,
} from "@/lib/schema";

export { getSponsorsConfig, pickSponsor } from "@/lib/sponsors";

// ---- Memoization ----
let _proposals: Proposal[] | null = null;
let _orgs: Organization[] | null = null;
let _techTags: TechTag[] | null = null;
let _tips: Tip[] | null = null;

export function getAllProposals(): Proposal[] {
  if (_proposals) return _proposals;
  const parsed = ProposalSchema.array().parse(proposalsRaw);
  // Sort: year desc, then orgSlug asc, then slug asc.
  parsed.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.orgSlug !== b.orgSlug) return a.orgSlug.localeCompare(b.orgSlug);
    return a.slug.localeCompare(b.slug);
  });
  _proposals = parsed;
  return _proposals;
}

export function getAllOrgs(): Organization[] {
  if (_orgs) return _orgs;
  _orgs = OrganizationSchema.array().parse(orgsRaw);
  _orgs.sort((a, b) => a.name.localeCompare(b.name));
  return _orgs;
}

export function getAllTechTags(): TechTag[] {
  if (_techTags) return _techTags;
  _techTags = TechTagSchema.array().parse(techTagsRaw);
  return _techTags;
}

// ---- Lookups ----
export function getProposalBySlugParts(
  year: string | number,
  orgSlug: string,
  slug: string,
): Proposal | null {
  const yearNum = typeof year === "string" ? Number.parseInt(year, 10) : year;
  if (Number.isNaN(yearNum)) return null;
  const all = getAllProposals();
  return (
    all.find(
      (p) => p.year === yearNum && p.orgSlug === orgSlug && p.slug === slug,
    ) ?? null
  );
}

export function getProposalsByYear(year: number): Proposal[] {
  return getAllProposals().filter((p) => p.year === year);
}

export function getProposalsByOrg(orgSlug: string): Proposal[] {
  return getAllProposals().filter((p) => p.orgSlug === orgSlug);
}

export function getProposalsByTech(tagSlug: string): Proposal[] {
  return getAllProposals().filter((p) => p.techTags.includes(tagSlug));
}

export function getOrgBySlug(slug: string): Organization | null {
  return getAllOrgs().find((o) => o.slug === slug) ?? null;
}

export function getTechTagBySlug(slug: string): TechTag | null {
  return getAllTechTags().find((t) => t.slug === slug) ?? null;
}

export function getYearsCovered(): number[] {
  const years = new Set<number>();
  for (const p of getAllProposals()) years.add(p.year);
  return [...years].sort((a, b) => b - a);
}

// ---- Stats ----
export interface SiteStats {
  proposalCount: number;
  yearCount: number;
  orgCount: number;
  techCount: number;
  contributorCount: number;
}

export function getSiteStats(): SiteStats {
  const proposals = getAllProposals();
  const yearSet = new Set<number>();
  const orgSet = new Set<string>();
  const techSet = new Set<string>();
  const contribSet = new Set<string>();
  for (const p of proposals) {
    yearSet.add(p.year);
    orgSet.add(p.orgSlug);
    for (const t of p.techTags) techSet.add(t);
    contribSet.add(p.contributor.displayName);
  }
  return {
    proposalCount: proposals.length,
    yearCount: yearSet.size,
    orgCount: orgSet.size,
    techCount: techSet.size,
    contributorCount: contribSet.size,
  };
}

// ---- Aggregations ----
export function getRelatedProposals(p: Proposal, n: number): Proposal[] {
  const all = getAllProposals();
  const sameOrg = all.filter((x) => x.orgSlug === p.orgSlug && x.slug !== p.slug);
  const overlap = (a: Proposal) =>
    a.techTags.filter((t) => p.techTags.includes(t)).length;
  const others = all
    .filter((x) => x.slug !== p.slug && x.orgSlug !== p.orgSlug)
    .map((x) => ({ x, score: overlap(x) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.x);
  const seen = new Set<string>();
  const out: Proposal[] = [];
  for (const item of [...sameOrg, ...others]) {
    if (out.length >= n) break;
    if (seen.has(item.slug)) continue;
    seen.add(item.slug);
    out.push(item);
  }
  return out;
}

export function getTopOrgsForTech(
  tagSlug: string,
  n: number,
): Array<{ org: Organization; count: number }> {
  const counts = new Map<string, number>();
  for (const p of getProposalsByTech(tagSlug)) {
    counts.set(p.orgSlug, (counts.get(p.orgSlug) ?? 0) + 1);
  }
  const orgsBySlug = new Map(getAllOrgs().map((o) => [o.slug, o]));
  return [...counts.entries()]
    .map(([slug, count]) => {
      const org = orgsBySlug.get(slug);
      return org ? { org, count } : null;
    })
    .filter((r): r is { org: Organization; count: number } => r !== null)
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export function getTopOrgs(n: number): Organization[] {
  return [...getAllOrgs()]
    .sort((a, b) => b.proposalCount - a.proposalCount)
    .slice(0, n);
}

export function getTopTechTags(n: number): Array<{ tag: TechTag; count: number }> {
  const counts = new Map<string, number>();
  for (const p of getAllProposals()) {
    for (const t of p.techTags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const tagsBySlug = new Map(getAllTechTags().map((t) => [t.slug, t]));
  return [...counts.entries()]
    .map(([slug, count]) => {
      const tag = tagsBySlug.get(slug);
      return tag ? { tag, count } : null;
    })
    .filter((r): r is { tag: TechTag; count: number } => r !== null)
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

// ---- Tips (MDX) ----
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const TIPS_DIR = path.join(process.cwd(), "data", "tips");

export function getAllTips(): Tip[] {
  if (_tips) return _tips;
  if (!fs.existsSync(TIPS_DIR)) {
    _tips = [];
    return _tips;
  }
  const files = fs.readdirSync(TIPS_DIR).filter((f) => f.endsWith(".mdx"));
  const tips: Tip[] = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(TIPS_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const fm = TipFrontmatterSchema.parse(data);
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    return { slug, frontmatter: fm, content, wordCount };
  });
  tips.sort(
    (a, b) =>
      Date.parse(b.frontmatter.lastUpdated) -
      Date.parse(a.frontmatter.lastUpdated),
  );
  _tips = tips;
  return tips;
}

export function getTipBySlug(slug: string): Tip | null {
  return getAllTips().find((t) => t.slug === slug) ?? null;
}
