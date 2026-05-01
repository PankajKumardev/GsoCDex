export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, "")
    .replace(/&/g, " and ")
    .replace(/\+/g, "p")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function formatKB(kb: number | undefined): string {
  if (kb === undefined || Number.isNaN(kb)) return "—";
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function formatPages(pages: number | undefined): string {
  if (pages === undefined) return "—";
  return `${pages} ${pages === 1 ? "page" : "pages"}`;
}

export function formatYear(y: number): string {
  return String(y);
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return `${n} ${n === 1 ? singular : (plural ?? `${singular}s`)}`;
}

export function compact<T>(arr: Array<T | null | undefined>): T[] {
  return arr.filter((x): x is T => x !== null && x !== undefined);
}

/**
 * Deterministic colour for a string — used for org monogram fallback.
 * Stable across renders so SSR / CSR match.
 */
export function hueFromString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  // Map to [0, 360) — keep saturation/lightness fixed elsewhere.
  return Math.abs(hash) % 360;
}

export function initialsFromName(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function initialsFromOrg(name: string): string {
  const cleaned = name.replace(/\(.+?\)/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}
