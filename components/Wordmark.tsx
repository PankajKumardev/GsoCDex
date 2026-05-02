import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";

interface WordmarkProps {
  className?: string;
  size?: "sm" | "base" | "lg";
  /** Show the GSoC sun logo to the left of the wordmark. */
  showSun?: boolean;
}

const SIZES = {
  sm: { type: "text-base", sun: 18 },
  base: { type: "text-xl", sun: 22 },
  lg: { type: "text-2xl md:text-3xl", sun: 28 },
} as const;

export function Wordmark({
  className,
  size = "base",
  showSun = true,
}: WordmarkProps) {
  const s = SIZES[size];
  return (
    <Link
      href="/"
      aria-label="GSoCDex — homepage"
      className={cn(
        "group inline-flex select-none items-center gap-2.5 text-app-ink",
        className,
      )}
    >
      {showSun && (
        <Image
          src="/illustrations/gsoc-sun.svg"
          alt=""
          width={s.sun}
          height={s.sun}
          unoptimized
          className="shrink-0 transition-transform duration-700 group-hover:rotate-[18deg]"
          priority
        />
      )}
      <span
        className={cn(
          "font-serif font-medium tracking-tight",
          s.type,
        )}
      >
        GSoC
        <span className="font-serif italic text-app-accent">Dex</span>
      </span>
    </Link>
  );
}
