"use client";

/**
 * Client-side search using minisearch.
 * The index is built at build time by `scripts/build-search-index.ts`
 * and served as a static asset at `/search-index.json`. We lazy-fetch it
 * the first time the search palette opens.
 */

import MiniSearch from "minisearch";

export type SearchKind = "proposal" | "org" | "tech" | "tip";

export interface SearchDoc {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle?: string;
  body: string;
  href: string;
}

export interface SearchHit {
  kind: SearchKind;
  title: string;
  subtitle?: string;
  href: string;
  score: number;
}

export interface SearchResults {
  proposals: SearchHit[];
  orgs: SearchHit[];
  techs: SearchHit[];
  tips: SearchHit[];
  total: number;
}

interface IndexFile {
  documents: SearchDoc[];
}

let indexPromise: Promise<MiniSearch<SearchDoc>> | null = null;
let resolvedIndex: MiniSearch<SearchDoc> | null = null;

const FIELDS = ["title", "subtitle", "body"] as const;
const STORE_FIELDS = ["kind", "title", "subtitle", "href"] as const;

const SEARCH_OPTIONS = {
  boost: { title: 3, subtitle: 1.5 },
  prefix: true,
  fuzzy: 0.2,
  combineWith: "AND" as const,
};

export async function loadSearchIndex(): Promise<MiniSearch<SearchDoc>> {
  if (indexPromise) return indexPromise;
  indexPromise = (async () => {
    const res = await fetch("/search-index.json", { cache: "force-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as IndexFile;
    const idx = new MiniSearch<SearchDoc>({
      idField: "id",
      fields: [...FIELDS],
      storeFields: [...STORE_FIELDS],
      searchOptions: SEARCH_OPTIONS,
    });
    idx.addAll(data.documents);
    resolvedIndex = idx;
    return idx;
  })().catch((err) => {
    indexPromise = null;
    throw err;
  });
  return indexPromise;
}

export function searchAll(query: string, perGroup = 6): SearchResults {
  const idx = resolvedIndex;
  const empty: SearchResults = {
    proposals: [],
    orgs: [],
    techs: [],
    tips: [],
    total: 0,
  };
  if (!idx) return empty;

  const raw = idx.search(query, SEARCH_OPTIONS);

  const groups: Record<SearchKind, SearchHit[]> = {
    proposal: [],
    org: [],
    tech: [],
    tip: [],
  };

  for (const r of raw) {
    const kind = r.kind as SearchKind;
    if (!groups[kind]) continue;
    if (groups[kind].length >= perGroup) continue;
    groups[kind].push({
      kind,
      title: r.title,
      subtitle: r.subtitle,
      href: r.href,
      score: r.score,
    });
  }

  return {
    proposals: groups.proposal,
    orgs: groups.org,
    techs: groups.tech,
    tips: groups.tip,
    total:
      groups.proposal.length + groups.org.length + groups.tech.length + groups.tip.length,
  };
}
