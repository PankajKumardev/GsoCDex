"use client";

import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
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
    <div className="container-ledger pb-24 pt-12 md:pt-16">
      <header className="mb-8">
        <p className="label-caps">The full ledger</p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-app-ink md:text-5xl">
          All proposals
        </h1>
        <p className="mt-3 text-sm text-app-muted md:text-base">
          Filter and read{" "}
          <span className="font-mono text-app-ink">{proposals.length}</span> accepted GSoC
          proposals.
        </p>
      </header>

      {/* Search input */}
      <div className="relative mb-5">
        <Search
          className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted"
          aria-hidden
        />
        <input
          type="search"
          value={qLocal}
          onChange={(e) => setQLocal(e.target.value)}
          placeholder="Search by title, contributor, or organization…"
          aria-label="Search proposals"
          className={cn(
            "h-12 w-full rounded-full border border-app-border bg-app-surface-elevated pl-12 pr-5",
            "font-sans text-base text-app-ink placeholder:text-app-muted",
            "shadow-card focus:border-app-accent/50 focus:outline-none focus:ring-2 focus:ring-app-accent-soft",
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

/**
 * FilterSelect — a custom dropdown built on Radix Popover + cmdk.
 *
 * Why not a native <select>? Because the OS picker can't be styled
 * (system blue highlight, system font, system scrollbar, system
 * positioning, auto-scroll-to-focused-item that hides surrounding
 * options). This implementation gives us:
 *   - Editorial Art Catalog tokens (alabaster, charcoal, gold, hairlines)
 *   - cmdk-driven type-to-filter (huge wins for the 84-org / 46-tag lists)
 *   - Capped max-height with scroll, never overflowing the viewport
 *   - Radix portal so it always lays out above other content
 *   - Full keyboard nav (↑↓ to move, Enter to pick, Esc to close)
 */
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
  const [open, setOpen] = useState(false);
  const active = !!value;
  const display = active
    ? options.find((o) => o.value === value)?.label ?? value
    : null;

  function pick(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full",
            "border bg-app-surface-elevated px-4 py-1.5 text-sm font-medium",
            "shadow-card transition-all",
            active
              ? "border-app-accent/30 bg-app-accent-soft text-app-accent-hover"
              : "border-app-border text-app-ink hover:border-app-accent/30 hover:bg-app-accent-soft/40",
          )}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-80">
            {label}
          </span>
          <span className="max-w-[10rem] truncate">{display ?? "Any"}</span>
          <ChevronDown
            className={cn(
              "h-3 w-3 shrink-0 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          data-lenis-prevent
          className={cn(
            "z-[60] w-[min(92vw,18rem)] overflow-hidden rounded-xl",
            "border border-app-border bg-app-surface-elevated",
            "shadow-modal",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
          )}
        >
          <Command shouldFilter={true} className="flex flex-col">
            <div className="border-b border-app-border px-3 py-2">
              <Command.Input
                placeholder={`Filter ${label.toLowerCase()}…`}
                className="h-8 w-full bg-transparent text-sm text-app-ink outline-none placeholder:text-app-muted"
              />
            </div>
            <Command.List
              data-lenis-prevent
              className="max-h-72 overflow-y-auto overscroll-contain p-1.5"
            >
              <Command.Empty className="px-3 py-6 text-center text-sm text-app-muted">
                No matches.
              </Command.Empty>
              {allowAny && (
                <Command.Item
                  value="__any__"
                  onSelect={() => pick("")}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2",
                    "font-mono text-[11px] uppercase tracking-[0.18em]",
                    "data-[selected=true]:bg-app-accent-soft/60 data-[selected=true]:text-app-accent",
                    "aria-selected:bg-app-accent-soft/60 aria-selected:text-app-accent",
                    !value
                      ? "text-app-accent"
                      : "text-app-muted",
                  )}
                >
                  <span>Any</span>
                  {!value && <Check className="h-3.5 w-3.5" aria-hidden />}
                </Command.Item>
              )}
              {options.map((o) => {
                const selected = o.value === value;
                return (
                  <Command.Item
                    key={o.value}
                    value={`${o.label} ${o.value}`}
                    onSelect={() => pick(o.value)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2",
                      "font-mono text-[11px] uppercase tracking-[0.16em]",
                      "data-[selected=true]:bg-app-accent-soft/60 data-[selected=true]:text-app-accent",
                      "aria-selected:bg-app-accent-soft/60 aria-selected:text-app-accent",
                      selected ? "text-app-accent" : "text-app-ink",
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                  </Command.Item>
                );
              })}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
