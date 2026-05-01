"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Virtuoso } from "react-virtuoso";

import { ProposalListItem } from "@/components/ProposalListItem";
import { cn } from "@/lib/cn";
import type { Organization, Proposal, TechTag } from "@/lib/schema";

interface BrowseClientProps {
  proposals: Proposal[];
  orgs: Organization[];
  techTags: TechTag[];
  years: number[];
}

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "org", label: "By org" },
  { id: "name", label: "By contributor" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

export function BrowseClient({ proposals, orgs, techTags, years }: BrowseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const year = searchParams.get("year") ?? "";
  const orgSlug = searchParams.get("org") ?? "";
  const techSlug = searchParams.get("tech") ?? "";
  const sort = (searchParams.get("sort") as SortId) || "newest";

  // Local input mirror so typing doesn't push to history on every keystroke.
  // We seed from the URL once via useState, and only re-sync when the URL
  // changes externally (e.g. browser back/forward) — to avoid the React
  // anti-pattern of calling setState inside an effect.
  const [qLocal, setQLocal] = useState(q);
  const [lastSyncedQ, setLastSyncedQ] = useState(q);
  if (q !== lastSyncedQ && q !== qLocal) {
    setLastSyncedQ(q);
    setQLocal(q);
  } else if (q !== lastSyncedQ) {
    setLastSyncedQ(q);
  }
  const qDebounced = useDeferredValue(qLocal);

  const techsBySlug = useMemo(() => new Map(techTags.map((t) => [t.slug, t])), [techTags]);
  const orgsBySlug = useMemo(() => new Map(orgs.map((o) => [o.slug, o])), [orgs]);

  // Apply filters.
  const filtered = useMemo(() => {
    const ql = qDebounced.trim().toLowerCase();
    const out: Proposal[] = [];
    for (const p of proposals) {
      if (year && String(p.year) !== year) continue;
      if (orgSlug && p.orgSlug !== orgSlug) continue;
      if (techSlug && !p.techTags.includes(techSlug)) continue;
      if (ql) {
        const hay = `${p.title} ${p.organization} ${p.contributor.displayName}`.toLowerCase();
        if (!hay.includes(ql)) continue;
      }
      out.push(p);
    }
    if (sort === "org") {
      out.sort((a, b) => a.organization.localeCompare(b.organization) || b.year - a.year);
    } else if (sort === "name") {
      out.sort((a, b) =>
        a.contributor.displayName.localeCompare(b.contributor.displayName) || b.year - a.year,
      );
    } else {
      out.sort((a, b) => b.year - a.year || a.orgSlug.localeCompare(b.orgSlug));
    }
    return out;
  }, [proposals, qDebounced, year, orgSlug, techSlug, sort]);

  // Update query params.
  const setParam = useCallback(
    (key: string, value: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (value) sp.set(key, value);
      else sp.delete(key);
      const qs = sp.toString();
      router.replace(qs ? `/browse?${qs}` : "/browse", { scroll: false });
    },
    [router, searchParams],
  );

  // Sync the search input to the URL when typing settles.
  useEffect(() => {
    if (qLocal !== q) {
      const t = setTimeout(() => setParam("q", qLocal), 250);
      return () => clearTimeout(t);
    }
  }, [qLocal, q, setParam]);

  function clearAll() {
    router.replace("/browse", { scroll: false });
  }

  const activeFilterCount =
    (q ? 1 : 0) + (year ? 1 : 0) + (orgSlug ? 1 : 0) + (techSlug ? 1 : 0);

  return (
    <div className="container-wide pb-24 pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-app-ink md:text-3xl">
          All proposals
        </h1>
        <p className="mt-1 text-sm text-app-muted">
          Filter and read{" "}
          <span className="font-mono text-app-ink">{proposals.length}</span> accepted GSoC
          proposals.
        </p>
      </header>

      {/* Search input */}
      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted"
          aria-hidden
        />
        <input
          type="search"
          value={qLocal}
          onChange={(e) => setQLocal(e.target.value)}
          placeholder="Search by title, contributor, or organization…"
          aria-label="Search proposals"
          className={cn(
            "h-12 w-full rounded-full border border-app-border bg-white pl-11 pr-4",
            "text-base text-app-ink placeholder:text-app-muted",
            "shadow-sm focus:border-app-accent focus:outline-none focus:ring-2 focus:ring-app-accent-subtle",
          )}
        />
      </div>

      {/* Filter bar */}
      <div className="mb-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        <FilterSelect
          label="Year"
          value={year}
          options={years.map((y) => ({ value: String(y), label: String(y) }))}
          onChange={(v) => setParam("year", v)}
        />
        <FilterSelect
          label="Org"
          value={orgSlug}
          options={orgs.map((o) => ({ value: o.slug, label: o.name }))}
          onChange={(v) => setParam("org", v)}
        />
        <FilterSelect
          label="Tech"
          value={techSlug}
          options={techTags.map((t) => ({ value: t.slug, label: t.label }))}
          onChange={(v) => setParam("tech", v)}
        />
        <FilterSelect
          label="Sort"
          value={sort}
          options={SORTS.map((s) => ({ value: s.id, label: s.label }))}
          onChange={(v) => setParam("sort", v === "newest" ? "" : v)}
          allowAny={false}
        />
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full",
              "border border-app-border bg-white px-4 py-1.5 text-sm font-medium text-app-ink",
              "shadow-sm hover:bg-app-surface",
            )}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      <p className="mb-4 font-mono text-xs uppercase tracking-wider text-app-muted">
        Showing {filtered.length} of {proposals.length}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-app-border bg-app-surface p-8 text-center">
          <p className="text-app-muted">No proposals match your filters.</p>
          <button
            type="button"
            onClick={clearAll}
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-app-border bg-white px-5 py-2 text-sm font-medium text-app-ink hover:bg-app-surface"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <Virtuoso
          useWindowScroll
          data={filtered}
          increaseViewportBy={400}
          itemContent={(_, p) => (
            <div className="pb-4">
              <ProposalListItem
                proposal={p}
                org={orgsBySlug.get(p.orgSlug)}
                techTagsBySlug={techsBySlug}
              />
            </div>
          )}
        />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  allowAny = true,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange(v: string): void;
  allowAny?: boolean;
}) {
  const active = !!value && (allowAny ? value !== "" : true);
  const display = active ? options.find((o) => o.value === value)?.label ?? value : null;
  return (
    <label
      className={cn(
        "relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full",
        "border bg-white px-4 py-1.5 text-sm font-medium shadow-sm transition-colors",
        active
          ? "border-app-accent/30 bg-app-accent-subtle text-app-accent"
          : "border-app-border text-app-ink hover:bg-app-surface",
      )}
    >
      <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">{label}</span>
      <span>{display ?? "Any"}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer appearance-none bg-transparent text-transparent opacity-0"
      >
        {allowAny && <option value="">Any</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
