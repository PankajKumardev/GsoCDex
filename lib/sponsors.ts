/**
 * Sponsor selection logic — pure data, no server-only deps.
 * Safe to import from both server and client components.
 */

import sponsorsRaw from "@/data/sponsors.json";
import { type Sponsor, type SponsorsConfig, SponsorsConfigSchema } from "@/lib/schema";

let _config: SponsorsConfig | null = null;

export function getSponsorsConfig(): SponsorsConfig {
  if (_config) return _config;
  _config = SponsorsConfigSchema.parse(sponsorsRaw);
  return _config;
}

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Returns an active sponsor for the given seed, or null when no sponsors
 * are configured. We intentionally do NOT fall back to the placeholders
 * list at runtime — placeholders exist only as a configuration template
 * for the owner; nothing renders until a real sponsor is set.
 */
export function pickSponsor(seed?: string): Sponsor | null {
  const cfg = getSponsorsConfig();
  if (cfg.active.length === 0) return null;
  const idx = seed ? hashSeed(seed) % cfg.active.length : 0;
  return cfg.active[idx] ?? null;
}
