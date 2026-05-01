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
          "flex h-12 w-full max-w-xl items-center gap-2 rounded-full",
          "bg-app-surface px-4 text-app-muted",
          "hover:bg-app-bg hover:shadow-card",
          "border border-transparent hover:border-app-border",
          "transition",
          className,
        )}
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-sm">Search proposals, orgs, tech tags…</span>
        <span className="ml-auto hidden items-center gap-1 md:flex">
          <kbd className="rounded-md border border-app-border bg-white px-1.5 py-0.5 font-mono text-[10px] text-app-muted">
            ⌘
          </kbd>
          <kbd className="rounded-md border border-app-border bg-white px-1.5 py-0.5 font-mono text-[10px] text-app-muted">
            K
          </kbd>
        </span>
      </button>
      <SearchPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
