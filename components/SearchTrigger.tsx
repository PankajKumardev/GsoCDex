"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { SearchPalette } from "@/components/SearchPalette";
import { cn } from "@/lib/cn";

interface SearchTriggerProps {
  className?: string;
}

export function SearchTrigger({ className }: SearchTriggerProps) {
  const [open, setOpen] = useState(false);

  // Global keyboard shortcuts: ⌘K and `/`
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !isTyping) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Open search"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-11 w-full min-w-0 max-w-xl items-center gap-2.5 rounded-full",
          "border border-app-border bg-app-bg/70 px-3.5 text-app-muted md:px-4 md:gap-3",
          "backdrop-blur-md transition-all",
          "hover:border-app-accent/30 hover:bg-app-accent-soft/40 hover:text-app-ink",
          className,
        )}
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-left text-sm font-normal">
          <span className="md:hidden">Search…</span>
          <span className="hidden md:inline">Search proposals, orgs, tech tags…</span>
        </span>
        <span className="hidden shrink-0 items-center gap-1 md:inline-flex">
          <kbd className="rounded-md border border-app-border bg-app-bg px-1.5 py-0.5 font-mono text-[10px] tracking-[0.18em] text-app-muted">
            ⌘K
          </kbd>
        </span>
      </button>
      <SearchPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
