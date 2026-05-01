import Link from "next/link";

import { cn } from "@/lib/cn";

interface WordmarkProps {
  className?: string;
  size?: "sm" | "base" | "lg";
}

export function Wordmark({ className, size = "base" }: WordmarkProps) {
  const sizes = {
    sm: "text-base",
    base: "text-lg",
    lg: "text-2xl md:text-3xl",
  };
  return (
    <Link
      href="/"
      aria-label="GSoCDex — homepage"
      className={cn(
        "font-sans font-semibold tracking-tight text-app-ink",
        "select-none",
        sizes[size],
        className,
      )}
    >
      GSoCDex
    </Link>
  );
}
