import Link from "next/link";

import { cn } from "@/lib/cn";

interface TechTagProps {
  slug: string;
  label: string;
  className?: string;
  asLink?: boolean;
}

export function TechTag({ slug, label, className, asLink = true }: TechTagProps) {
  const cls = cn(
    "inline-block rounded-md bg-status-tech px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-status-tech-text",
    asLink && "transition-colors hover:bg-app-accent-subtle hover:text-app-accent",
    className,
  );
  if (asLink) {
    return (
      <Link href={`/tech/${slug}`} className={cls}>
        {label}
      </Link>
    );
  }
  return <span className={cls}>{label}</span>;
}
