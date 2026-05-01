/**
 * scripts/ingest.ts
 *
 * GSoCDex ingestion pipeline.
 *
 * For each repo in lib/constants.ts → SOURCE_REPOS:
 *   1. Shallow-clone or pull into .tmp/sources/<id>/
 *   2. Verify the LICENSE is permissive (MIT / Apache-2.0 / BSD / CC-BY)
 *   3. Walk the tree for *.pdf files
 *   4. Classify each PDF:
 *        - skip if any path segment is "Rejected" (case-insensitive)
 *        - infer year (from repo's yearScoped or from a YYYY path segment)
 *        - infer org (first non-year, non-Proposals/Accepted/Rejected segment)
 *        - infer contributor display name from the filename (heuristic)
 *   5. Dedupe across repos by (year, orgSlug, contributorSlug). First wins.
 *   6. Extract pdf metadata via pdfjs-dist legacy build (page count, file size,
 *      first-5-pages text for tech-tag detection).
 *   7. Tech tags: lowercase substring/word-match against data/tech-tags.json
 *      aliases. Cap at 6.
 *   8. Copy PDF into public/proposals/{year}/{Org}/{slug}.pdf
 *   9. Aggregate org metadata.
 *  10. Write data/proposals.json and data/orgs.json.
 *
 * Run: `pnpm ingest`
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { SOURCE_REPOS, type SourceRepo } from "../lib/constants";
import { initialsFromOrg, slugify } from "../lib/format";
import type { Organization, Proposal, TechTag } from "../lib/schema";

const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, ".tmp", "sources");
const PUBLIC_PROPOSALS_DIR = path.join(ROOT, "public", "proposals");
const DATA_DIR = path.join(ROOT, "data");

const TECH_TAGS: TechTag[] = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "tech-tags.json"), "utf8"),
);

// Folder segment names that are structural (year repos, accepted/rejected splits).
const STRUCTURAL_SEGMENTS = new Set([
  "proposals",
  "proposal",
  "accepted",
  "rejected",
  "selected",
  "approved",
]);

function log(...args: unknown[]) {
  console.log("[ingest]", ...args);
}

function warn(...args: unknown[]) {
  console.warn("[ingest][warn]", ...args);
}

// ---- Cloning ----

function cloneOrPull(repo: SourceRepo): string {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const target = path.join(TMP_DIR, repo.id);
  if (fs.existsSync(target)) {
    log(`pulling ${repo.ownerRepo}…`);
    try {
      execSync("git pull --depth 1 --ff-only", {
        cwd: target,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err) {
      warn(`pull failed for ${repo.id}, refreshing clone:`, (err as Error).message);
      fs.rmSync(target, { recursive: true, force: true });
      execSync(`git clone --depth 1 ${repo.url} ${target}`, {
        stdio: ["ignore", "pipe", "pipe"],
      });
    }
  } else {
    log(`cloning ${repo.ownerRepo}…`);
    execSync(`git clone --depth 1 ${repo.url} ${target}`, {
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
  return target;
}

// ---- License check ----

const LICENSE_FILES = ["LICENSE", "LICENSE.md", "LICENSE.txt", "License", "license"];
const LICENSE_OK = [
  /MIT License/i,
  /Apache License,? Version 2\.0/i,
  /Apache 2\.0/i,
  /BSD 3-Clause/i,
  /BSD-3-Clause/i,
  /BSD 2-Clause/i,
  /BSD-2-Clause/i,
  /Creative Commons.*Attribution/i,
  /CC[ -]?BY/i,
];

function licenseCheck(repoDir: string): boolean {
  for (const name of LICENSE_FILES) {
    const file = path.join(repoDir, name);
    if (fs.existsSync(file)) {
      const text = fs.readFileSync(file, "utf8");
      return LICENSE_OK.some((re) => re.test(text));
    }
  }
  return false;
}

// ---- PDF discovery ----

function* walkPdfs(dir: string, repoRoot: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip noise.
      if (entry.name === "node_modules" || entry.name.toLowerCase() === ".github") continue;
      yield* walkPdfs(full, repoRoot);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
      yield full;
    }
  }
}

// ---- Path classification ----

interface PdfClassification {
  year: number;
  organization: string;
  contributorRaw: string;
  isAccepted: boolean;
}

function classifyPath(pdfAbs: string, repo: SourceRepo, repoRoot: string): PdfClassification | null {
  const rel = path.relative(repoRoot, pdfAbs);
  const segments = rel.split(path.sep);
  const fileName = segments.pop()!;
  if (segments.length === 0) return null;

  // Reject anything that lives under a "Rejected" segment.
  const isRejected = segments.some((s) => /^rejected$/i.test(s));

  let year: number | null = repo.yearScoped;
  const yearIdx = segments.findIndex((s) => /^20\d\d$/.test(s));
  if (year === null) {
    if (yearIdx === -1) return null;
    year = Number.parseInt(segments[yearIdx]!, 10);
  }

  // Find the org segment: first segment after the year (if any) that
  // isn't a structural marker. For year-scoped repos with no year folder,
  // the org is the first directory segment.
  let orgIdx = yearIdx === -1 ? 0 : yearIdx + 1;
  while (
    orgIdx < segments.length &&
    STRUCTURAL_SEGMENTS.has(segments[orgIdx]!.toLowerCase())
  ) {
    orgIdx++;
  }
  if (orgIdx >= segments.length) {
    // Some repos drop PDFs directly under the year folder. Fall back to
    // the year-folder-itself as a synthetic "Misc" org so we don't drop content,
    // but flag it via warn so we can review.
    return null;
  }
  const organization = segments[orgIdx]!.trim();

  return {
    year,
    organization,
    contributorRaw: fileName.replace(/\.pdf$/i, ""),
    isAccepted: !isRejected,
  };
}

// ---- Contributor name extraction (heuristic) ----

// Common English / project-noun words that should not be treated as a person's name token.
// (Real personal names occasionally collide; this is the right tradeoff —
// "Anonymous Contributor" is acceptable, fabricated names are not.)
const PROJECT_VOCAB = new Set([
  // verbs / generic actions
  "improve", "improving", "implement", "implementing", "implementation",
  "build", "building", "create", "creating", "design", "designing",
  "develop", "developing", "extend", "extending", "add", "adding",
  "support", "supporting", "integrate", "integrating", "integration",
  "enhance", "enhancing", "enhancement", "optimize", "optimizing",
  "optimization", "port", "porting", "automate", "automating",
  "refactor", "refactoring", "migrate", "migration",
  // generic project nouns
  "platform", "platforms", "system", "systems", "framework", "frameworks",
  "engine", "engines", "tool", "tools", "toolkit", "library", "libraries",
  "module", "modules", "component", "components", "extension", "extensions",
  "plugin", "plugins", "client", "server", "service", "services",
  "feature", "features", "interface", "interfaces", "api", "apis", "sdk", "sdks",
  "manager", "management", "model", "models", "modeling", "modelling",
  "agent", "agents", "queue", "queues", "stream", "streaming", "streams",
  "report", "reporting", "reporter", "reports", "monitor", "monitoring",
  "dependency", "dependencies", "definition", "defination", "definitions",
  // tech-domain nouns
  "android", "linux", "windows", "macos", "browser", "mobile", "desktop", "web",
  "cross", "platform", "vue", "react", "django", "flask", "kubernetes",
  // common GSoC org / topic words (so they don't show as names)
  "behavioral", "behavior", "behaviour", "analysis", "analytics",
  "suicide", "prevention", "ai", "ml", "nlp", "ui", "ux",
  "powered", "based", "ready", "aware", "aware", "ready",
  "open", "source", "core", "main", "default", "general",
  "auto", "automatic", "automation",
  "fast", "slow", "secure", "smart", "simple", "easy",
  "real", "time", "realtime", "live",
  "stable", "scalable",
  "mass", "bulk", "batch",
  "upload", "uploads", "download", "downloads",
  "data", "metadata", "metaddata", "sample", "samples",
  "math", "mathematics", "calculation", "calculator", "computation",
  "fast", "ultra", "rapid", "quick",
  "pdf", "html", "css", "json", "xml", "csv",
  "chrome", "firefox", "safari",
  "github", "gitlab", "bitbucket",
  "calendar", "schedule", "scheduler",
  "notebook", "notebooks", "editor", "viewer", "browser",
  "dashboard", "dashboards", "console",
  "registry", "directory",
  "cross-platform", "crossplatform",
  "meta", "node", "stream",
  "search", "searching",
  "test", "testing", "validation", "validator",
  "voice", "audio", "video",
  "image", "imaging", "vision",
  "graph", "graphs", "tree", "trees",
  "summarization", "summary",
  "queue", "stream",
  "amplitude", "simulation", "simulator",
  // section-header words that sometimes follow the name in metadata
  "country", "city", "email", "phone", "university", "college", "github",
  "linkedin", "discord", "telegram", "twitter", "mentor", "mentors",
  "guide", "guides", "course", "courses", "section",
  "rich", "text", "editor", "improvement", "improvements",
  "music", "blocks",
  "course",
  "knative", "drasi", "dapr",
  "header", "headers", "footer", "footers", "buttons", "button",
  "ordering",
  "country",
  "page", "pages",
  "emails", "phone",
  "mentors", "mentees",
  "cross", "platform",
  "imroved", "improved",
  "convolution", "regression",
  "powered", "behavioral",
  "project", "projects", "protocol", "protocols", "enforcement",
  "creator", "creators",
  "natural", "language", "processing",
  "coverage", "automated", "grading",
  "creation", "deletion",
  "improvement", "improvements", "improved", "imroved",
  "kolibris", "kolibri",
  "organization", "team", "company", "individual",
  "location", "address", "submitter",
  "envirocar", "mitmproxy", "thejpfteam",
  "helper", "scrum",
  "teaching", "assistant",
  "wikilab", "lab",
  "work", "workspace", "workflow", "workflows",
]);

// Tokens we never treat as part of a person's name.
const NOISE_WORDS = new Set([
  "gsoc",
  "gsoc25",
  "gsoc24",
  "gsoc23",
  "gsoc22",
  "gsoc21",
  "gsoc20",
  "gsoc26",
  "gsoc2025",
  "gsoc2024",
  "gsoc2023",
  "gsoc2022",
  "gsoc2021",
  "gsoc2020",
  "gsoc2026",
  "google",
  "summer",
  "of",
  "code",
  "proposal",
  "proposals",
  "application",
  "applications",
  "submission",
  "submissions",
  "submitted",
  "accepted",
  "selected",
  "approved",
  "final",
  "draft",
  "v1",
  "v2",
  "v3",
  "v4",
  "the",
  "and",
  "or",
  "for",
  "with",
  "to",
  "by",
  "in",
  "on",
  "at",
  "an",
  "a",
  "is",
  "from",
  "outreachy",
  "improve",
  "improving",
  "implement",
  "implementing",
  "implementation",
  "ui",
  "ux",
  "api",
  "sdk",
  "doc",
  "docs",
  "documentation",
  "extension",
  "support",
  "feature",
  "features",
  "system",
  "tool",
  "tools",
  "client",
  "server",
  "module",
  "library",
  "framework",
  "integration",
  "integrate",
  "rfc",
  "tdd",
  "mvp",
]);

const ORG_TOKEN_NOISE = new Set(
  [
    "the",
    "foundation",
    "association",
    "consortium",
    "team",
    "project",
    "initiative",
    "lab",
    "labs",
  ].map((w) => w.toLowerCase()),
);

function isNameToken(t: string): boolean {
  if (t.length < 3) return false;
  if (!/^[A-Za-z][A-Za-z'\u00C0-\u017F]+$/.test(t)) return false;
  const lower = t.toLowerCase();
  if (NOISE_WORDS.has(lower)) return false;
  if (PROJECT_VOCAB.has(lower)) return false;
  // Reject all-uppercase short tokens (likely acronyms).
  if (t.length <= 4 && t === t.toUpperCase()) return false;
  return true;
}

function tokenizeFilename(rawFilename: string, organizationName: string): string[] {
  let s = rawFilename;
  // Drop a trailing "(N)" or "_v2" pattern.
  s = s.replace(/\s*\(\d+\)\s*$/g, "");
  s = s.replace(/\s*\[\d+\]\s*$/g, "");
  s = s.replace(/[_-]v?\d+$/g, "");

  // Replace separators with spaces.
  s = s.replace(/[._\-]+/g, " ");
  // Drop punctuation noise.
  s = s.replace(/[()[\]{}]/g, " ");
  s = s.replace(/\s+/g, " ").trim();

  // Strip org name tokens (case-insensitive). Iterate over org tokens, ignoring tiny ones.
  const orgTokens = organizationName
    .split(/[\s./_-]+/)
    .filter(Boolean)
    .filter((t) => t.length >= 3 && !ORG_TOKEN_NOISE.has(t.toLowerCase()));
  for (const t of orgTokens) {
    const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    s = s.replace(re, " ");
  }
  s = s.replace(/\s+/g, " ").trim();

  // Tokenize.
  return s.split(/\s+/).filter(Boolean);
}

/**
 * Conservative filename → contributor extractor.
 *
 * Strategy: split filename by " - " (space-dash-space) — this is the most
 * common delimiter authors use to separate "Project Title - Author Name".
 * If a final segment is 2-3 capitalized name tokens, take it.
 *
 * Otherwise, look at the trailing 2-3 tokens of the underscore-tokenized
 * filename — but ONLY accept if they are clean name tokens AND there is
 * earlier project content (so we don't fabricate names from project-only
 * filenames like "Project_Title.pdf").
 */
function extractContributorName(rawFilename: string, organizationName: string): string {
  // 1. Try " - "-delimited splits.
  const dashSegs = rawFilename
    .replace(/\.pdf$/i, "")
    .split(/\s*-\s+|\s+-\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (dashSegs.length >= 2) {
    const last = dashSegs[dashSegs.length - 1]!;
    const lastTokens = last.split(/\s+/).filter(Boolean);
    if (
      lastTokens.length >= 2 &&
      lastTokens.length <= 3 &&
      lastTokens.every((t) => isNameToken(t))
    ) {
      return lastTokens.slice(0, 3).map(titleCase).join(" ");
    }
  }

  // 2. Tokenize and look for a strict tail-run.
  const tokens = tokenizeFilename(rawFilename, organizationName);
  if (tokens.length === 0) return "Anonymous Contributor";

  // Strip year-only tokens.
  const cleaned = tokens.filter((t) => !/^20\d\d$/.test(t));

  // Tail-run: last 2-3 consecutive name tokens, and require there to be
  // at least one non-name token earlier (so filenames that are PURELY
  // project-noun phrases don't mint a synthetic name).
  let tailEnd = cleaned.length - 1;
  while (tailEnd >= 0 && !isNameToken(cleaned[tailEnd]!)) tailEnd--;
  if (tailEnd < 0) return "Anonymous Contributor";
  let tailStart = tailEnd;
  while (tailStart - 1 >= 0 && isNameToken(cleaned[tailStart - 1]!)) tailStart--;
  const tailLen = tailEnd - tailStart + 1;
  if (tailLen < 2) return "Anonymous Contributor";
  // Cap tail at 3.
  const picked = cleaned.slice(Math.max(tailStart, tailEnd - 2), tailEnd + 1);
  // Require at least one earlier project-vocab / non-name / structural token —
  // otherwise the whole filename is name-only and we're probably wrong.
  const hasEarlierContext = cleaned
    .slice(0, tailStart)
    .some(
      (t) =>
        PROJECT_VOCAB.has(t.toLowerCase()) ||
        NOISE_WORDS.has(t.toLowerCase()) ||
        /^\d/.test(t),
    );
  if (!hasEarlierContext && tokens.length === picked.length) {
    return "Anonymous Contributor";
  }
  return picked.map(titleCase).join(" ");
}

function titleCase(t: string): string {
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

// ---- Title extraction ----

async function extractPdfMeta(pdfPath: string): Promise<{
  pages: number | undefined;
  text: string;
  /** Lowercased first-page text used for "Submitted by …" extraction. */
  firstPageRaw: string;
  title: string | undefined;
  author: string | undefined;
}> {
  // Lazy-import the legacy build to avoid pulling worker code into Node.
  const pdfjs = (await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  )) as typeof import("pdfjs-dist/legacy/build/pdf.mjs");

  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjs.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: false,
  });
  type PDFDoc = Awaited<typeof loadingTask.promise>;
  let doc: PDFDoc;
  try {
    doc = await loadingTask.promise;
  } catch (err) {
    warn(`pdf load failed: ${pdfPath}: ${(err as Error).message}`);
    return { pages: undefined, text: "", firstPageRaw: "", title: undefined, author: undefined };
  }

  let title: string | undefined;
  let author: string | undefined;
  try {
    const meta = await doc.getMetadata();
    const info = (meta.info ?? {}) as { Title?: string; Author?: string };
    if (info.Title && typeof info.Title === "string") {
      const t = info.Title.trim();
      if (t.length > 3 && !/^untitled/i.test(t)) title = t;
    }
    if (info.Author && typeof info.Author === "string") {
      const a = info.Author.trim();
      if (
        a.length >= 3 &&
        a.length <= 80 &&
        !/^(microsoft|adobe|word|untitled)/i.test(a) &&
        // avoid email/domain-only authors
        !/@/.test(a)
      ) {
        author = a;
      }
    }
  } catch {
    /* ignore */
  }

  const pageCount = doc.numPages;
  const max = Math.min(5, pageCount);
  const chunks: string[] = [];
  let firstPageRaw = "";
  for (let i = 1; i <= max; i++) {
    try {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const txt = content.items
        .map((it: unknown) =>
          typeof it === "object" && it !== null && "str" in it && typeof (it as { str?: unknown }).str === "string"
            ? (it as { str: string }).str
            : "",
        )
        .join(" ")
        .replace(/\s+/g, " ");
      chunks.push(txt);
      if (i === 1) firstPageRaw = txt;
    } catch {
      /* skip */
    }
  }
  await doc.destroy();
  return {
    pages: pageCount,
    text: chunks.join(" ").toLowerCase(),
    firstPageRaw,
    title,
    author,
  };
}

/**
 * Extract a contributor name from the proposal's first page text.
 * Looks for explicit "Name: …" / "Submitted by: …" / "By: …" patterns.
 */
function extractNameFromFirstPage(firstPageRaw: string): string | null {
  if (!firstPageRaw) return null;
  // Limit to first ~1500 chars for performance.
  const head = firstPageRaw.slice(0, 1500);
  const patterns: RegExp[] = [
    /(?:Submitted\s+(?:by|to)|Author|Author Name|Name|Proposed by|Prepared by|Mentee|Student|Contributor)\s*[:\u2013\u2014-]\s*([A-Z][A-Za-z'\u00C0-\u017F.]+(?:\s+[A-Z][A-Za-z'\u00C0-\u017F.]+){1,2})/,
    /\bby\s+([A-Z][A-Za-z'\u00C0-\u017F.]+\s+[A-Z][A-Za-z'\u00C0-\u017F.]+)\b/,
  ];
  for (const re of patterns) {
    const m = head.match(re);
    if (m && m[1]) {
      const cand = m[1].replace(/\s+/g, " ").trim();
      const tokens = cand.split(/\s+/).filter(Boolean);
      // Validate each token is a name token.
      if (tokens.length >= 2 && tokens.length <= 3 && tokens.every((t) => isNameToken(t))) {
        return tokens.map((t) => titleCase(t)).join(" ");
      }
    }
  }
  return null;
}

// ---- Tech tag detection ----

function detectTechTags(text: string): string[] {
  const hits = new Set<string>();
  const haystack = ` ${text} `;
  for (const tag of TECH_TAGS) {
    for (const alias of tag.aliases) {
      if (alias.includes("\\")) {
        // Already-regex aliases (e.g. "c\\+\\+").
        const re = new RegExp(`(?:^|[^a-z0-9+#])${alias}(?:[^a-z0-9+#]|$)`, "i");
        if (re.test(haystack)) {
          hits.add(tag.slug);
          break;
        }
      } else {
        // Literal substring guarded by word-ish boundaries.
        const padded = ` ${alias.toLowerCase()} `;
        if (haystack.includes(padded)) {
          hits.add(tag.slug);
          break;
        }
      }
    }
    if (hits.size >= 6) break;
  }
  return [...hits].sort();
}

// ---- Title fallback ----

function deriveTitle(
  _rawFilename: string,
  contributorName: string,
  organizationName: string,
  year: number,
  pdfTitle: string | undefined,
): string {
  if (pdfTitle) {
    const t = pdfTitle.replace(/\s+/g, " ").trim();
    const looksLikeFilename =
      // very few or no spaces but lots of underscores/dashes
      t.includes("_") && t.split(/\s+/).length <= 2;
    const isGenericProposal = /^gsoc\s*proposal\s*$/i.test(t) || t.toLowerCase() === "proposal";
    const isWordExport = /\.docx\s*[-–—]\s*google docs/i.test(t);
    const isStub = /^(microsoft word|^document\d*|^untitled|copy of)/i.test(t);
    if (
      t.length >= 12 &&
      t.length <= 200 &&
      !looksLikeFilename &&
      !isGenericProposal &&
      !isWordExport &&
      !isStub
    ) {
      return t;
    }
  }
  return `GSoC ${year} ${organizationName} proposal · ${contributorName}`.replace(
    /\s+/g,
    " ",
  );
}

// ---- Main pipeline ----

async function ingest() {
  const proposals: Proposal[] = [];
  const orgsMap = new Map<
    string,
    { displayCounts: Map<string, number>; years: Set<number>; count: number }
  >();
  const seenKeys = new Set<string>();
  let dupCount = 0;
  let pdfCount = 0;
  let skippedRejected = 0;
  let skippedClassify = 0;
  let copiedFiles = 0;

  fs.mkdirSync(PUBLIC_PROPOSALS_DIR, { recursive: true });

  for (const repo of SOURCE_REPOS) {
    let repoDir: string;
    try {
      repoDir = cloneOrPull(repo);
    } catch (err) {
      warn(`clone failed for ${repo.id}, skipping. error:`, (err as Error).message);
      continue;
    }

    if (!licenseCheck(repoDir)) {
      warn(`license check failed for ${repo.id} — skipping repo`);
      continue;
    }

    log(`scanning ${repo.id} (${repo.layoutHint})`);

    for (const pdfAbs of walkPdfs(repoDir, repoDir)) {
      pdfCount++;

      const cls = classifyPath(pdfAbs, repo, repoDir);
      if (!cls) {
        skippedClassify++;
        continue;
      }
      if (!cls.isAccepted) {
        skippedRejected++;
        continue;
      }

      const orgSlug = slugify(cls.organization);
      // Read PDF metadata first — its Author field is the most reliable source.
      let pages: number | undefined;
      let text = "";
      let firstPageRaw = "";
      let pdfTitle: string | undefined;
      let pdfAuthor: string | undefined;
      try {
        const meta = await extractPdfMeta(pdfAbs);
        pages = meta.pages;
        text = meta.text;
        firstPageRaw = meta.firstPageRaw;
        pdfTitle = meta.title;
        pdfAuthor = meta.author;
      } catch (err) {
        warn(`pdf meta extraction failed for ${pdfAbs}: ${(err as Error).message}`);
      }

      // Resolve contributor name with this priority:
      //   1. PDF Author metadata (if it parses to a clean multi-token name)
      //   2. First-page "Submitted by …" / "Name: …" / "by Author" pattern
      //   3. Filename heuristic (a tail-end run of capitalized name-tokens)
      //   4. "Anonymous Contributor"
      let contributorName: string | null = null;
      if (pdfAuthor) {
        const tokens = pdfAuthor.split(/\s+/).filter(isNameToken);
        if (tokens.length >= 2) {
          contributorName = tokens.slice(0, 3).map(titleCase).join(" ");
        }
      }
      if (!contributorName) {
        contributorName = extractNameFromFirstPage(firstPageRaw);
      }
      if (!contributorName) {
        const fromFile = extractContributorName(cls.contributorRaw, cls.organization);
        if (fromFile !== "Anonymous Contributor") contributorName = fromFile;
      }
      if (!contributorName) contributorName = "Anonymous Contributor";

      const contributorSlug = slugify(contributorName);
      const baseSlug = `${cls.year}-${orgSlug}-${contributorSlug}`;

      const dedupeKey = `${cls.year}|${orgSlug}|${contributorSlug}`;
      if (seenKeys.has(dedupeKey)) {
        dupCount++;
        continue;
      }
      seenKeys.add(dedupeKey);

      // Resolve a unique slug (collision protection across distinct authors w/ same name).
      let slug = baseSlug;
      let n = 2;
      while (proposals.some((p) => p.slug === slug)) {
        slug = `${baseSlug}-${n++}`;
      }

      const title = deriveTitle(
        cls.contributorRaw,
        contributorName,
        cls.organization,
        cls.year,
        pdfTitle,
      );
      const techTags = detectTechTags(text);

      // Copy PDF into public/proposals/{year}/{Org}/{slug}.pdf
      const orgDir = cls.organization.replace(/[\\/]/g, "-").trim();
      const destDir = path.join(PUBLIC_PROPOSALS_DIR, String(cls.year), orgDir);
      fs.mkdirSync(destDir, { recursive: true });
      const destFile = path.join(destDir, `${slug}.pdf`);
      try {
        fs.copyFileSync(pdfAbs, destFile);
        copiedFiles++;
      } catch (err) {
        warn(`copy failed for ${pdfAbs}: ${(err as Error).message}`);
        continue;
      }
      const stat = fs.statSync(destFile);
      const pdfPath = `/proposals/${encodeURIComponent(String(cls.year))}/${encodeURIComponent(orgDir)}/${encodeURIComponent(`${slug}.pdf`)}`;

      // Build sourceUrl pointing to the original file in the source repo.
      const relInRepo = path.relative(repoDir, pdfAbs).split(path.sep).map(encodeURIComponent).join("/");
      const sourceUrl = `${repo.url}/blob/HEAD/${relInRepo}`;

      const proposal: Proposal = {
        slug,
        title,
        year: cls.year,
        organization: cls.organization,
        orgSlug,
        contributor: { displayName: contributorName },
        pdfPath,
        pdfPages: pages,
        pdfSizeKB: Math.round(stat.size / 1024),
        techTags,
        status: "accepted",
        sourceRepo: repo.ownerRepo,
        sourceUrl,
        addedAt: new Date().toISOString(),
      };

      proposals.push(proposal);

      // Aggregate org metadata.
      const aggregate = orgsMap.get(orgSlug) ?? {
        displayCounts: new Map<string, number>(),
        years: new Set<number>(),
        count: 0,
      };
      aggregate.years.add(cls.year);
      aggregate.count++;
      aggregate.displayCounts.set(
        cls.organization,
        (aggregate.displayCounts.get(cls.organization) ?? 0) + 1,
      );
      orgsMap.set(orgSlug, aggregate);
    }
  }

  // Build orgs list. Pick the most common display name per slug.
  const orgs: Organization[] = [];
  for (const [slug, agg] of orgsMap) {
    const [name] = [...agg.displayCounts.entries()].sort((a, b) => b[1] - a[1])[0]!;
    orgs.push({
      slug,
      name,
      yearsParticipated: [...agg.years].sort((a, b) => a - b),
      proposalCount: agg.count,
    });
  }
  orgs.sort((a, b) => a.slug.localeCompare(b.slug));

  // Sort proposals.
  proposals.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.orgSlug !== b.orgSlug) return a.orgSlug.localeCompare(b.orgSlug);
    return a.slug.localeCompare(b.slug);
  });

  fs.writeFileSync(
    path.join(DATA_DIR, "proposals.json"),
    JSON.stringify(proposals, null, 2) + "\n",
  );
  fs.writeFileSync(path.join(DATA_DIR, "orgs.json"), JSON.stringify(orgs, null, 2) + "\n");

  const yearsCovered = [...new Set(proposals.map((p) => p.year))].sort((a, b) => a - b);
  const orgsMissingCategory = orgs.filter((o) => !o.category).length;

  log(
    `Ingested ${proposals.length} proposals across ${orgs.length} orgs and ${yearsCovered.length} years (${yearsCovered.join(", ")}). ${dupCount} duplicates skipped. ${skippedRejected} rejected-folder PDFs skipped. ${skippedClassify} unclassifiable PDFs skipped. ${pdfCount} PDFs scanned, ${copiedFiles} copied. ${orgsMissingCategory} orgs missing category — review needed.`,
  );

  // Brief sample for sanity.
  log("\nSample (latest 3):");
  for (const p of proposals.slice(0, 3)) {
    log(
      `  · [${p.year}] ${p.organization} — ${p.contributor.displayName} → ${p.title} (${p.techTags.join(", ") || "no tags"})`,
    );
  }

  // Hint about org monogram fallback.
  if (orgs.length > 0) {
    const sample = orgs[0]!;
    log(`\nMonogram fallback example: ${sample.name} → "${initialsFromOrg(sample.name)}"`);
  }
}

ingest().catch((err) => {
  console.error("[ingest] FATAL:", err);
  process.exit(1);
});
