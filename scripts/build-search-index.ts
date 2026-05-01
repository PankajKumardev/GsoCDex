/**
 * scripts/build-search-index.ts
 *
 * Builds /public/search-index.json from current data sources.
 * Runs as `prebuild` so production builds always have a fresh index.
 */

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

interface SearchDoc {
  id: string;
  kind: "proposal" | "org" | "tech" | "tip";
  title: string;
  subtitle?: string;
  body: string;
  href: string;
}

const ROOT = process.cwd();
const PUBLIC_PATH = path.join(ROOT, "public", "search-index.json");
const DATA_PATH = path.join(ROOT, "data");

function readJson<T>(file: string, fallback: T): T {
  const full = path.join(DATA_PATH, file);
  if (!fs.existsSync(full)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(full, "utf8")) as T;
  } catch (err) {
    console.warn(`[search-index] Failed to parse ${file}:`, err);
    return fallback;
  }
}

function readTips(): Array<{
  slug: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
}> {
  const dir = path.join(DATA_PATH, "tips");
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    const { data, content } = matter(raw);
    const slug = f.replace(/\.mdx$/, "");
    return {
      slug,
      title: String(data.title ?? slug),
      summary: String(data.summary ?? ""),
      body: content.slice(0, 4000),
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    };
  });
}

interface ProposalRow {
  slug: string;
  title: string;
  year: number;
  organization: string;
  orgSlug: string;
  contributor: { displayName: string };
  techTags: string[];
  description?: string;
}

interface OrgRow {
  slug: string;
  name: string;
  description?: string;
  category?: string;
  yearsParticipated: number[];
  proposalCount: number;
}

interface TechRow {
  slug: string;
  label: string;
  description: string;
  aliases: string[];
}

const proposals = readJson<ProposalRow[]>("proposals.json", []);
const orgs = readJson<OrgRow[]>("orgs.json", []);
const techs = readJson<TechRow[]>("tech-tags.json", []);
const tips = readTips();

const documents: SearchDoc[] = [];

for (const p of proposals) {
  documents.push({
    id: `proposal:${p.slug}`,
    kind: "proposal",
    title: p.title,
    subtitle: `${p.organization} · ${p.year} · ${p.contributor.displayName}`,
    body: [p.description ?? "", p.techTags.join(" "), p.contributor.displayName, p.organization]
      .join(" ")
      .trim(),
    href: `/p/${p.year}/${p.orgSlug}/${p.slug}`,
  });
}

for (const o of orgs) {
  documents.push({
    id: `org:${o.slug}`,
    kind: "org",
    title: o.name,
    subtitle:
      [o.category, `${o.proposalCount} proposal${o.proposalCount === 1 ? "" : "s"}`]
        .filter(Boolean)
        .join(" · ") || undefined,
    body: [o.description ?? "", o.category ?? "", o.yearsParticipated.join(" ")]
      .join(" ")
      .trim(),
    href: `/org/${o.slug}`,
  });
}

for (const t of techs) {
  documents.push({
    id: `tech:${t.slug}`,
    kind: "tech",
    title: t.label,
    subtitle: undefined,
    body: [t.description, ...t.aliases].join(" "),
    href: `/tech/${t.slug}`,
  });
}

for (const tip of tips) {
  documents.push({
    id: `tip:${tip.slug}`,
    kind: "tip",
    title: tip.title,
    subtitle: tip.summary,
    body: [tip.summary, tip.body, tip.tags.join(" ")].join(" "),
    href: `/tips/${tip.slug}`,
  });
}

fs.mkdirSync(path.dirname(PUBLIC_PATH), { recursive: true });
fs.writeFileSync(
  PUBLIC_PATH,
  JSON.stringify({ documents, builtAt: new Date().toISOString() }, null, 0),
);

console.log(
  `[search-index] Wrote ${documents.length} documents (${proposals.length} proposals, ${orgs.length} orgs, ${techs.length} techs, ${tips.length} tips) → public/search-index.json`,
);
