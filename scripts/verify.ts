/**
 * scripts/verify.ts
 *
 * Pre-commit / pre-deploy verifications:
 *   1. Newsletter sweep — fail if any disallowed token appears in source.
 *   2. Trademark sweep  — fail if a GSoC logo file accidentally lands in /public.
 *
 * Run with `pnpm verify`.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const SCAN_DIRS = ["app", "components", "lib", "data", "scripts"];

// Hard-banned patterns (newsletter / email-collection signals).
// Patterns are matched case-insensitively.
// We allow the literal word "subscribe" only inside specific files
// where it is unambiguously NOT a newsletter (e.g. a search-action label).
const NEWSLETTER_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /beehiiv/i, description: "Beehiiv newsletter" },
  { pattern: /mailchimp/i, description: "Mailchimp newsletter" },
  { pattern: /convertkit/i, description: "ConvertKit newsletter" },
  { pattern: /\bnewsletter\b/i, description: "newsletter mention" },
  { pattern: /email\s*signup/i, description: "email signup" },
  { pattern: /\bsubscribe\b/i, description: "subscribe button/link" },
];

interface Hit {
  file: string;
  line: number;
  text: string;
  description: string;
}

const ALLOWLIST: ReadonlyArray<{
  file: string;
  pattern: RegExp;
  reason: string;
}> = [
  {
    file: "scripts/verify.ts",
    pattern: /./,
    reason: "Verification script defines the patterns; the file is excluded.",
  },
  {
    file: "PLAN.md",
    pattern: /./,
    reason: "Plan document references the rules.",
  },
  {
    file: "scratchpad.md",
    pattern: /./,
    reason: "Scratchpad notes reference the rules.",
  },
];

function isAllowlisted(file: string, line: string): boolean {
  return ALLOWLIST.some(
    (a) => file.endsWith(a.file) && a.pattern.test(line),
  );
}

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

function newsletterScan(): Hit[] {
  const hits: Hit[] = [];
  const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".mdx", ".md", ".json", ".css"]);
  for (const dir of SCAN_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      const ext = path.extname(file);
      if (!exts.has(ext)) continue;
      const rel = path.relative(ROOT, file);
      const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? "";
        if (isAllowlisted(rel, line)) continue;
        for (const { pattern, description } of NEWSLETTER_PATTERNS) {
          if (pattern.test(line)) {
            hits.push({ file: rel, line: i + 1, text: line.trim(), description });
            break;
          }
        }
      }
    }
  }
  return hits;
}

function trademarkScan(): Hit[] {
  const hits: Hit[] = [];
  const publicDir = path.join(ROOT, "public");
  if (!fs.existsSync(publicDir)) return hits;
  for (const file of walk(publicDir)) {
    const rel = path.relative(ROOT, file);
    const base = path.basename(file).toLowerCase();
    if (/gsoc[-_]?logo|google[-_]?logo/.test(base)) {
      hits.push({
        file: rel,
        line: 0,
        text: base,
        description: "Disallowed GSoC/Google logo asset in /public",
      });
    }
  }
  return hits;
}

const newsHits = newsletterScan();
const tmHits = trademarkScan();

if (newsHits.length === 0 && tmHits.length === 0) {
  console.log("[verify] OK — no newsletter / trademark violations found.");
  process.exit(0);
}

if (newsHits.length > 0) {
  console.error(`[verify] ❌ Newsletter sweep found ${newsHits.length} hit(s):`);
  for (const h of newsHits) {
    console.error(`  ${h.file}:${h.line}  [${h.description}]  ${h.text}`);
  }
}
if (tmHits.length > 0) {
  console.error(`[verify] ❌ Trademark sweep found ${tmHits.length} hit(s):`);
  for (const h of tmHits) {
    console.error(`  ${h.file}  [${h.description}]`);
  }
}
process.exit(1);
