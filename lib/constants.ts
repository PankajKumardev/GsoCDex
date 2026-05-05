/**
 * Site-wide constants for GSoCDex.
 */

export const SITE_NAME = "GSoCDex";
export const SITE_TAGLINE = "Every accepted GSoC proposal, browsable.";
export const SITE_DESCRIPTION =
  "Browse and read accepted Google Summer of Code proposals from across the years. Curated from open community archives. Free, fast, no signup.";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://gsoc-dex.vercel.app";

export const TWITTER_HANDLE = "@gsocdex";

/**
 * Source repositories ingested into GSoCDex.
 * Order is significant: when a duplicate is detected, the FIRST occurrence wins.
 * (We list richer / more recent sources first so they take precedence.)
 */
export interface SourceRepo {
  /** Stable internal id used in metadata */
  id: string;
  /** GitHub `owner/repo` */
  ownerRepo: string;
  /** Owner display name (link target / attribution) */
  owner: string;
  /** Public repo URL */
  url: string;
  /** If the repo covers exactly one year, set it here. Otherwise null and year is inferred from path. */
  yearScoped: number | null;
  /** Short layout hint shown in ingest logs */
  layoutHint: string;
}

export const SOURCE_REPOS: ReadonlyArray<SourceRepo> = [
  {
    id: "samman-2025",
    ownerRepo: "SammanSarkar/GSoC_archive_2025",
    owner: "SammanSarkar",
    url: "https://github.com/SammanSarkar/GSoC_archive_2025",
    yearScoped: 2025,
    layoutHint: "Org/file.pdf",
  },
  {
    id: "satwik-2026",
    ownerRepo: "satwiksps/GSoC_archive_2026",
    owner: "satwiksps",
    url: "https://github.com/satwiksps/GSoC_archive_2026",
    yearScoped: 2026,
    layoutHint: "Org/{Accepted,Rejected}/file.pdf",
  },
  {
    id: "aritra-multi",
    ownerRepo: "Aritra8438/GSoC_archive",
    owner: "Aritra8438",
    url: "https://github.com/Aritra8438/GSoC_archive",
    yearScoped: null,
    layoutHint: "YYYY/Org/Proposals/{Accepted,Rejected}/file.pdf",
  },
  {
    id: "gsoc-archive",
    ownerRepo: "Google-Summer-of-Code-Archive/gsoc-proposals-archive",
    owner: "Google-Summer-of-Code-Archive",
    url: "https://github.com/Google-Summer-of-Code-Archive/gsoc-proposals-archive",
    yearScoped: null,
    layoutHint: "YYYY/Org/file.pdf",
  },
];

/** OG image fallback (static, branded). */
export const OG_DEFAULT_PATH = "/og/og-default.png";

/** Approximate font sizes for OG generation */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
