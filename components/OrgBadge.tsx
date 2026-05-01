import Image from "next/image";

import { cn } from "@/lib/cn";
import { hueFromString, initialsFromOrg } from "@/lib/format";

interface OrgBadgeProps {
  /** Display name. Used as alt text and to derive initials. */
  name: string;
  /** Org slug, used as a deterministic seed for the fallback colour. */
  slug: string;
  /** Optional explicit logoUrl. If provided, an image is rendered. */
  logoUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_PX = { sm: 24, md: 40, lg: 64 } as const;
const TEXT_CLASS = {
  sm: "text-[10px]",
  md: "text-sm",
  lg: "text-xl",
} as const;

export function OrgBadge({ name, slug, logoUrl, size = "sm", className }: OrgBadgeProps) {
  const px = SIZE_PX[size];
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={px}
        height={px}
        unoptimized={logoUrl.endsWith(".svg")}
        className={cn(
          "rounded-md border border-app-border bg-white object-contain",
          className,
        )}
        sizes={`${px}px`}
      />
    );
  }
  // Deterministic colour fallback monogram.
  const hue = hueFromString(slug);
  const initials = initialsFromOrg(name);
  return (
    <span
      aria-label={name}
      style={{
        backgroundColor: `hsl(${hue}, 60%, 92%)`,
        color: `hsl(${hue}, 65%, 30%)`,
        width: px,
        height: px,
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md font-semibold leading-none",
        TEXT_CLASS[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}
