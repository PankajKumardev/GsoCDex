/**
 * scripts/ingest-sdslabs.ts
 *
 * Pulls accepted GSoC proposals listed at
 *   https://blog.sdslabs.co/gsoc/
 * Author has explicitly granted permission to redistribute.
 *
 * The blog HTML is unusually clean: each <li> has the literal
 *   "{Contributor Name} - {Org Name}"
 * text node followed by [Project] and [Proposal] anchors, grouped under
 * <h4>YEAR</h4> headers. So unlike the main ingest pipeline we can
 * skip filename heuristics entirely.
 *
 * Usage: pnpm ingest:sdslabs
 */

import fs from "node:fs";
import path from "node:path";

import { slugify } from "../lib/format";
import type { Organization, Proposal, TechTag } from "../lib/schema";

const ROOT = process.cwd();
const PUBLIC_PROPOSALS_DIR = path.join(ROOT, "public", "proposals");
const DATA_DIR = path.join(ROOT, "data");
const SOURCE_URL = "https://blog.sdslabs.co/gsoc/";
const SOURCE_REPO = "sdslabs/gsoc-blog";

const TECH_TAGS: TechTag[] = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "tech-tags.json"), "utf8"),
);

const FETCH_TIMEOUT_MS = 25_000;
const THROTTLE_MS = 1200;
const MAX_PDF_BYTES = 60 * 1024 * 1024; // 60 MB safety cap

function log(...args: unknown[]) {
  console.log("[sdslabs]", ...args);
}
function warn(...args: unknown[]) {
  console.warn("[sdslabs][warn]", ...args);
}

// ---------------------------------------------------------------- HTML scrape

interface BlogEntry {
  year: number;
  contributor: string;
  organization: string;
  proposalUrl: string;
  projectUrl?: string;
}

async function scrapeBlog(): Promise<BlogEntry[]> {
  const html = await (await fetch(SOURCE_URL)).text();

  // Walk the doc looking for <h4>YEAR</h4> ... <ul> ... </ul>
  const entries: BlogEntry[] = [];
  // Match each h4 + the trailing text up to the next h4 or end-of-section.
  const yearBlocks = [
    ...html.matchAll(/<h4>(\d{4})<\/h4>([\s\S]*?)(?=<h4>\d{4}<\/h4>|<\/div>)/g),
  ];
  for (const block of yearBlocks) {
    const year = Number.parseInt(block[1]!, 10);
    const blockHtml = block[2]!;
    // Now match each <li> ... </li>
    const liMatches = [...blockHtml.matchAll(/<li>([\s\S]*?)<\/li>/g)];
    for (const li of liMatches) {
      const liHtml = li[1]!;
      // Extract the text node before the first <a>
      const textBeforeAnchor = liHtml.split(/<a\b/i)[0] ?? "";
      const cleanText = textBeforeAnchor
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[-\u2013\u2014]\s*$/, "")
        .trim();

      // "Name - Org" — split on the LAST " - " to handle org names with hyphens.
      const dashIdx = cleanText.lastIndexOf(" - ");
      if (dashIdx === -1) continue;
      const contributor = cleanText.slice(0, dashIdx).trim();
      const organization = cleanText.slice(dashIdx + 3).trim();
      if (!contributor || !organization) continue;

      // Find [Proposal] anchor
      const anchors = [
        ...liHtml.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/g),
      ];
      let proposalUrl: string | undefined;
      let projectUrl: string | undefined;
      for (const a of anchors) {
        const href = a[1]!;
        const label = a[2]!.trim().toLowerCase();
        if (label.includes("proposal")) proposalUrl = href;
        else if (label.includes("project")) projectUrl = href;
      }
      if (!proposalUrl) continue;
      entries.push({ year, contributor, organization, proposalUrl, projectUrl });
    }
  }
  return entries;
}

// --------------------------------------------------------------- URL classify

interface FetchPlan {
  kind: "drive" | "docs" | "direct" | "gitlab" | "shortlink" | "skip";
  fetchUrl: string;
  reason?: string;
}

function planFetch(url: string): FetchPlan {
  // drive.google.com/file/d/{id}/view
  let m = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (m) return { kind: "drive", fetchUrl: `https://drive.google.com/uc?export=download&id=${m[1]}` };
  // drive.google.com/open?id={id}
  m = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (m) return { kind: "drive", fetchUrl: `https://drive.google.com/uc?export=download&id=${m[1]}` };
  // docs.google.com/document/d/{id}
  m = url.match(/docs\.google\.com\/document\/d\/([^/?#]+)/);
  if (m) return { kind: "docs", fetchUrl: `https://docs.google.com/document/d/${m[1]}/export?format=pdf` };
  // gitlab.gnome.org/.../*.pdf?ref_type=heads → /-/raw/main/...
  if (/gitlab\.gnome\.org\/.+\.pdf/.test(url)) {
    return {
      kind: "gitlab",
      fetchUrl: url.replace("/-/blob/", "/-/raw/").replace(/\?ref_type=[^#&]*/, ""),
    };
  }
  // direct .pdf
  if (/\.pdf(\?|#|$)/i.test(url)) return { kind: "direct", fetchUrl: url };
  // Shortlinks (goo.gl, bit.ly, t.co) — resolve at runtime via HEAD redirect.
  if (/(?:goo\.gl|bit\.ly|t\.co|tinyurl\.com)\//.test(url)) {
    return { kind: "shortlink", fetchUrl: url };
  }
  return { kind: "skip", fetchUrl: url, reason: "unsupported link type" };
}

/**
 * Resolve a shortlink to its final destination, then re-classify.
 * Follows redirects manually (not via fetch's redirect:'follow') so we
 * can inspect the final URL and route it through the right fetcher.
 */
async function resolveShortlink(url: string): Promise<FetchPlan> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15_000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GSoCDex-Ingest/1.0; +https://gsoc-dex.vercel.app)",
      },
    });
    clearTimeout(t);
    const finalUrl = res.url;
    if (!finalUrl || finalUrl === url) {
      return { kind: "skip", fetchUrl: url, reason: "shortlink did not resolve" };
    }
    // Re-classify the resolved URL.
    return planFetch(finalUrl);
  } catch (err) {
    return {
      kind: "skip",
      fetchUrl: url,
      reason: `shortlink resolution failed: ${(err as Error).message}`,
    };
  }
}

// ------------------------------------------------------------------- fetching

const PDF_MAGIC = Buffer.from("%PDF-");

async function fetchPdf(url: string): Promise<Buffer | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GSoCDex-Ingest/1.0; +https://gsoc-dex.vercel.app)",
        Accept: "application/pdf,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      warn(`HTTP ${res.status} for ${url}`);
      return null;
    }
    const len = Number.parseInt(res.headers.get("content-length") ?? "0", 10);
    if (len > MAX_PDF_BYTES) {
      warn(`skipping ${url} — content-length ${len} > ${MAX_PDF_BYTES}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) {
      warn(`empty body from ${url}`);
      return null;
    }
    if (!buf.slice(0, 5).equals(PDF_MAGIC)) {
      // Probably an HTML login / virus-scan / consent page.
      warn(`not a PDF (got HTML or other) from ${url}`);
      return null;
    }
    return buf;
  } catch (err) {
    warn(`fetch failed for ${url}: ${(err as Error).message}`);
    return null;
  } finally {
    clearTimeout(t);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------- pdf metadata + tags

async function extractPdfMeta(pdfPath: string): Promise<{
  pages: number | undefined;
  text: string;
  title: string | undefined;
}> {
  const pdfjs = (await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  )) as typeof import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const task = pdfjs.getDocument({ data, disableFontFace: true, useSystemFonts: false });
  let doc: Awaited<typeof task.promise>;
  try {
    doc = await task.promise;
  } catch {
    return { pages: undefined, text: "", title: undefined };
  }
  let title: string | undefined;
  try {
    const meta = await doc.getMetadata();
    const info = (meta.info ?? {}) as { Title?: string };
    if (info.Title && typeof info.Title === "string") {
      const t = info.Title.trim();
      if (t.length >= 6 && !/^untitled/i.test(t) && !t.includes("_") ) title = t;
    }
  } catch {
    /* ignore */
  }
  const max = Math.min(5, doc.numPages);
  const chunks: string[] = [];
  for (let i = 1; i <= max; i++) {
    try {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const txt = content.items
        .map((it: unknown) =>
          typeof it === "object" &&
          it !== null &&
          "str" in it &&
          typeof (it as { str?: unknown }).str === "string"
            ? (it as { str: string }).str
            : "",
        )
        .join(" ")
        .replace(/\s+/g, " ");
      chunks.push(txt);
    } catch {
      /* skip */
    }
  }
  await doc.destroy();
  return { pages: doc.numPages, text: chunks.join(" ").toLowerCase(), title };
}

function detectTechTags(text: string): string[] {
  const hits = new Set<string>();
  const haystack = ` ${text} `;
  for (const tag of TECH_TAGS) {
    for (const alias of tag.aliases) {
      if (alias.includes("\\")) {
        const re = new RegExp(`(?:^|[^a-z0-9+#])${alias}(?:[^a-z0-9+#]|$)`, "i");
        if (re.test(haystack)) {
          hits.add(tag.slug);
          break;
        }
      } else {
        if (haystack.includes(` ${alias.toLowerCase()} `)) {
          hits.add(tag.slug);
          break;
        }
      }
    }
    if (hits.size >= 6) break;
  }
  return [...hits].sort();
}

// ---------------------------------------------------------------- main

async function main() {
  fs.mkdirSync(PUBLIC_PROPOSALS_DIR, { recursive: true });
  log(`fetching ${SOURCE_URL}…`);
  const entries = await scrapeBlog();
  log(`parsed ${entries.length} entries from blog HTML`);

  // Load existing data — we'll merge, not overwrite.
  const existingProposals: Proposal[] = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "proposals.json"), "utf8"),
  );
  const existingOrgs: Organization[] = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "orgs.json"), "utf8"),
  );

  const dedupeSet = new Set(
    existingProposals.map((p) => `${p.year}|${p.orgSlug}|${slugify(p.contributor.displayName)}`),
  );

  const newProposals: Proposal[] = [];
  let skipped = 0;
  let dead = 0;
  let dupes = 0;
  let unsupported = 0;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const orgSlug = slugify(e.organization);
    const contributorSlug = slugify(e.contributor);
    const dedupeKey = `${e.year}|${orgSlug}|${contributorSlug}`;
    if (dedupeSet.has(dedupeKey)) {
      dupes++;
      continue;
    }

    let plan = planFetch(e.proposalUrl);
    // Resolve shortlinks at runtime, then re-route through the proper fetcher.
    if (plan.kind === "shortlink") {
      log(
        `[${i + 1}/${entries.length}] [${e.year}] ${e.contributor} → ${e.organization} (resolving shortlink…)`,
      );
      plan = await resolveShortlink(e.proposalUrl);
      await sleep(THROTTLE_MS);
    }
    if (plan.kind === "skip") {
      unsupported++;
      log(`  skip [${e.year}] ${e.contributor} → ${e.organization}: ${plan.reason}`);
      continue;
    }

    log(
      `[${i + 1}/${entries.length}] [${e.year}] ${e.contributor} → ${e.organization} (${plan.kind})`,
    );

    const buf = await fetchPdf(plan.fetchUrl);
    if (!buf) {
      dead++;
      await sleep(THROTTLE_MS);
      continue;
    }

    const baseSlug = `${e.year}-${orgSlug}-${contributorSlug}`;
    let slug = baseSlug;
    let n = 2;
    while (
      newProposals.some((p) => p.slug === slug) ||
      existingProposals.some((p) => p.slug === slug)
    ) {
      slug = `${baseSlug}-${n++}`;
    }

    const orgDir = e.organization.replace(/[\\/]/g, "-").trim();
    const destDir = path.join(PUBLIC_PROPOSALS_DIR, String(e.year), orgDir);
    fs.mkdirSync(destDir, { recursive: true });
    const destFile = path.join(destDir, `${slug}.pdf`);
    fs.writeFileSync(destFile, buf);
    const stat = fs.statSync(destFile);
    const pdfPath = `/proposals/${encodeURIComponent(String(e.year))}/${encodeURIComponent(orgDir)}/${encodeURIComponent(`${slug}.pdf`)}`;

    let pages: number | undefined;
    let text = "";
    let pdfTitle: string | undefined;
    try {
      const meta = await extractPdfMeta(destFile);
      pages = meta.pages;
      text = meta.text;
      pdfTitle = meta.title;
    } catch {
      /* leave undefined */
    }

    const techTags = detectTechTags(text);

    const title =
      pdfTitle && pdfTitle.length >= 8 && pdfTitle.length <= 200
        ? pdfTitle
        : `GSoC ${e.year} ${e.organization} proposal · ${e.contributor}`;

    newProposals.push({
      slug,
      title,
      year: e.year,
      organization: e.organization,
      orgSlug,
      contributor: { displayName: e.contributor },
      pdfPath,
      pdfPages: pages,
      pdfSizeKB: Math.round(stat.size / 1024),
      techTags,
      status: "accepted",
      sourceRepo: SOURCE_REPO,
      sourceUrl: e.proposalUrl,
      addedAt: new Date().toISOString(),
    });

    dedupeSet.add(dedupeKey);
    await sleep(THROTTLE_MS);
  }

  // Merge into existing proposals.
  const merged = [...existingProposals, ...newProposals];
  merged.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.orgSlug !== b.orgSlug) return a.orgSlug.localeCompare(b.orgSlug);
    return a.slug.localeCompare(b.slug);
  });

  // Update orgs.json.
  const orgMap = new Map<string, Organization>();
  for (const o of existingOrgs) orgMap.set(o.slug, { ...o });
  for (const p of newProposals) {
    const existing = orgMap.get(p.orgSlug);
    if (existing) {
      const yearsSet = new Set(existing.yearsParticipated);
      yearsSet.add(p.year);
      existing.yearsParticipated = [...yearsSet].sort((a, b) => a - b);
      existing.proposalCount = (existing.proposalCount ?? 0) + 1;
    } else {
      orgMap.set(p.orgSlug, {
        slug: p.orgSlug,
        name: p.organization,
        yearsParticipated: [p.year],
        proposalCount: 1,
      });
    }
  }
  const orgs = [...orgMap.values()].sort((a, b) => a.slug.localeCompare(b.slug));

  fs.writeFileSync(path.join(DATA_DIR, "proposals.json"), JSON.stringify(merged, null, 2) + "\n");
  fs.writeFileSync(path.join(DATA_DIR, "orgs.json"), JSON.stringify(orgs, null, 2) + "\n");

  const yearsCovered = [...new Set(merged.map((p) => p.year))].sort((a, b) => a - b);
  log("---");
  log(
    `Ingested ${newProposals.length} new proposals from sdslabs.co. ${dupes} duplicates skipped. ${dead} dead/private links. ${unsupported} unsupported link types.`,
  );
  log(`Total dataset now: ${merged.length} proposals across ${orgs.length} orgs and ${yearsCovered.length} years (${yearsCovered.join(", ")}).`);
  log("\nSample (first 3 added):");
  for (const p of newProposals.slice(0, 3)) {
    log(`  · [${p.year}] ${p.organization} — ${p.contributor.displayName} (${p.techTags.join(", ") || "no tags"})`);
  }
}

main().catch((err) => {
  console.error("[sdslabs] FATAL:", err);
  process.exit(1);
});
