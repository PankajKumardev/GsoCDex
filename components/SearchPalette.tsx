"use client";

/**
 * SearchPalette — cmdk-based modal that lazy-loads the prebuilt minisearch index
 * from /search-index.json. Full-screen on mobile, centered card on desktop.
 *
 * The index loader is intentionally guarded so this component renders before the
 * search index has been built (during early development phases).
 */

import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { ArrowRight, FileText, Hash, Lightbulb, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import {
  loadSearchIndex,
  type SearchHit,
  searchAll,
} from "@/lib/search-client";

interface SearchPaletteProps {
  open: boolean;
  onOpenChange(open: boolean): void;
}

export function SearchPalette({ open, onOpenChange }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    loadSearchIndex()
      .then(() => {
        if (alive) setReady(true);
      })
      .catch((err: unknown) => {
        if (alive) {
          console.warn("[search] index unavailable:", err);
          setError("Search index isn't deployed yet.");
        }
      });
    return () => {
      alive = false;
    };
  }, [open]);

  const results = useMemo(() => {
    if (!ready || !query.trim()) return null;
    return searchAll(query);
  }, [query, ready]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
          )}
        />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-[100]",
            "inset-0 md:inset-auto md:left-1/2 md:top-24 md:-translate-x-1/2",
            "md:w-[640px] md:max-w-[92vw]",
            "bg-white md:rounded-2xl md:shadow-modal",
            "flex flex-col overflow-hidden",
          )}
        >
          <Dialog.Title className="sr-only">Search GSoCDex</Dialog.Title>
          <Command shouldFilter={false} className="flex h-full flex-col md:h-auto md:max-h-[70vh]">
            <div className="flex items-center gap-3 border-b border-app-border px-4 py-3">
              <Search className="h-4 w-4 text-app-muted" aria-hidden />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search proposals, orgs, tech tags, tips…"
                className="h-10 flex-1 bg-transparent text-base text-app-ink outline-none placeholder:text-app-muted"
                autoFocus
              />
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-app-muted hover:bg-app-surface"
              >
                Esc
              </button>
            </div>
            <Command.List className="flex-1 overflow-y-auto p-2">
              {error && <EmptyState text={error} />}
              {!error && !ready && <EmptyState text="Loading index…" />}
              {!error && ready && !query.trim() && (
                <EmptyState text="Type to search across proposals, orgs, tech tags, and tips." />
              )}
              {!error && ready && query.trim() && results && results.total === 0 && (
                <EmptyState text={`No matches for "${query}"`} />
              )}
              {!error && ready && results && results.total > 0 && (
                <>
                  <ResultGroup
                    heading="Proposals"
                    icon={<FileText className="h-3 w-3" aria-hidden />}
                    hits={results.proposals}
                    onSelect={() => onOpenChange(false)}
                  />
                  <ResultGroup
                    heading="Organizations"
                    icon={<ArrowRight className="h-3 w-3" aria-hidden />}
                    hits={results.orgs}
                    onSelect={() => onOpenChange(false)}
                  />
                  <ResultGroup
                    heading="Tech tags"
                    icon={<Hash className="h-3 w-3" aria-hidden />}
                    hits={results.techs}
                    onSelect={() => onOpenChange(false)}
                  />
                  <ResultGroup
                    heading="Tips"
                    icon={<Lightbulb className="h-3 w-3" aria-hidden />}
                    hits={results.tips}
                    onSelect={() => onOpenChange(false)}
                  />
                </>
              )}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Command.Empty className="px-4 py-12 text-center text-sm text-app-muted">{text}</Command.Empty>
  );
}

function ResultGroup({
  heading,
  icon,
  hits,
  onSelect,
}: {
  heading: string;
  icon: React.ReactNode;
  hits: SearchHit[];
  onSelect: () => void;
}) {
  if (hits.length === 0) return null;
  return (
    <Command.Group
      heading={heading}
      className="mb-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-app-muted"
    >
      {hits.map((hit) => (
        <Command.Item
          key={`${hit.kind}:${hit.href}`}
          value={`${hit.title} ${hit.subtitle ?? ""}`}
          onSelect={onSelect}
          asChild
        >
          <Link
            href={hit.href}
            className="group flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-app-accent-subtle"
            onClick={onSelect}
          >
            <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-app-surface text-app-muted">
              {icon}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-app-ink">{hit.title}</span>
              {hit.subtitle && <span className="truncate text-xs text-app-muted">{hit.subtitle}</span>}
            </span>
          </Link>
        </Command.Item>
      ))}
    </Command.Group>
  );
}
