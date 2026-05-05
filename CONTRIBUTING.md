# Contributing to GSoCDex

> **Live site:** [gsoc-dex.vercel.app](https://gsoc-dex.vercel.app)

Thanks for wanting to make GSoCDex better. This is a community-run archive — every PR helps.

There are three main ways to contribute:

1. [**Add an accepted proposal**](#1-add-an-accepted-proposal) (you wrote it, or it's yours to share)
2. [**Improve metadata**](#2-improve-metadata) (titles, contributor names, tech tags, org descriptions)
3. [**Code or content improvements**](#3-code--content-improvements) (UI, tips articles, ingest pipeline, accessibility)

---

## Before you start

- ✅ Have a real, accepted GSoC proposal PDF (rejected ones aren't in scope yet — coming in v2)
- ✅ Have permission to redistribute it (you authored it, or the original author is OK with it)
- ✅ Read [our trademark + author rights policy](https://gsoc-dex.vercel.app/disclosures) — we honour author removal requests within 7 days
- ✅ You agree your contribution is licensed under the project's **MIT** license

---

## 1. Add an accepted proposal

This is the most common contribution. Two routes:

### A) The simple route — open an issue

If you're not comfortable with PRs:

1. Go to [github.com/PankajKumardev/GsoCDex/issues/new](https://github.com/PankajKumardev/GsoCDex/issues/new)
2. Title it: `Add proposal: [Year] [Org] — [Your name]`
3. Attach (or link to) the PDF
4. Include: year, organization, your full name, optional GitHub handle
5. Owner reviews, runs the ingest manually, and ships

### B) The PR route — preferred

```bash
# Fork the repo, then:
git clone https://github.com/<your-fork>/GsoCDex.git
cd GsoCDex
pnpm install
git checkout -b add-proposal-2025-sympy-jane-doe
```

#### Step 1 — Add the PDF

Drop your file at:

```
public/proposals/{year}/{OrgName}/{slug}.pdf
```

Where:

- `{year}` is a 4-digit year, e.g. `2025`
- `{OrgName}` is the org's display name (matches existing folders if the org is already indexed — see `public/proposals/2025/`)
- `{slug}` is `kebab-case`, ideally `{year}-{org-slug}-{contributor-slug}.pdf` for consistency with the auto-generated entries

Examples:

```
public/proposals/2025/SymPy/2025-sympy-jane-doe.pdf
public/proposals/2024/CircuitVerse/2024-circuitverse-arjun-patel.pdf
```

#### Step 2 — Append your entry to `data/proposals.json`

Open [`data/proposals.json`](./data/proposals.json) and add your object. The schema is defined in [`lib/schema.ts`](./lib/schema.ts) and **zod-validated** at build time, so getting it wrong will fail the build.

Required fields:

```jsonc
{
  "slug": "2025-sympy-jane-doe",
  "title": "Improving Symbolic Equation Simplification in SymPy",
  "year": 2025,
  "organization": "SymPy",
  "orgSlug": "sympy",
  "contributor": {
    "displayName": "Jane Doe",
    "githubUsername": "janedoe"   // optional
  },
  "pdfPath": "/proposals/2025/SymPy/2025-sympy-jane-doe.pdf",
  "pdfPages": 18,                  // optional, but please fill in
  "pdfSizeKB": 712,                // optional
  "techTags": ["python", "ml"],    // slugs from data/tech-tags.json
  "status": "accepted",
  "sourceRepo": "SammanSarkar/GSoC_archive_2025",   // OR a personal repo URL if you're submitting your own
  "sourceUrl": "https://github.com/SammanSarkar/GSoC_archive_2025/blob/HEAD/SymPy/your-pdf.pdf",
  "addedAt": "2026-05-02T00:00:00.000Z",
  "description": "Optional 1–2 sentence summary"   // helps surface as a 'featured' card
}
```

**Tech tags** must be slugs from [`data/tech-tags.json`](./data/tech-tags.json) (don't invent new ones in a proposal PR — open a separate issue if a tag is missing). Cap at **6 per proposal**.

**Slug uniqueness:** if the auto-generated slug collides with an existing entry, suffix with `-2`, `-3`, etc.

#### Step 3 — Append to `data/orgs.json` (only if your org isn't already there)

```jsonc
{
  "slug": "sympy",
  "name": "SymPy",
  "yearsParticipated": [2024, 2025],   // include the new year you're adding
  "proposalCount": 2,                   // bump this
  "category": "Math",                   // optional but helpful
  "websiteUrl": "https://www.sympy.org",
  "description": "Symbolic mathematics in Python."
}
```

If the org **is already there**, just bump `proposalCount` and add the year to `yearsParticipated` if it's new.

#### Step 4 — Verify locally

```bash
pnpm build-search-index    # regenerate /public/search-index.json
pnpm typecheck             # zod will reject malformed entries
pnpm lint
pnpm verify                # newsletter / trademark sweep
pnpm dev                   # browse to /p/{year}/{orgSlug}/{slug} to spot-check
```

#### Step 5 — Commit + open the PR

```bash
git add public/proposals/2025/SymPy/2025-sympy-jane-doe.pdf data/proposals.json data/orgs.json public/search-index.json
git commit -m "feat(proposals): add 2025 SymPy proposal by Jane Doe"
git push -u origin add-proposal-2025-sympy-jane-doe
```

Then open a PR using the [pull-request template](./.github/PULL_REQUEST_TEMPLATE.md). The template asks the right questions; just fill it in.

---

## 2. Improve metadata

Saw a wrong contributor name? A wrong tech tag? An org with no category? PRs welcome.

- Edit `data/proposals.json` or `data/orgs.json` directly
- Run `pnpm typecheck` + `pnpm verify` to make sure nothing breaks
- One PR per category of fix is preferred (don't mix proposal additions with metadata cleanup)

---

## 3. Code & content improvements

### UI / UX changes

```bash
pnpm dev                   # local at :3000
pnpm build && pnpm start   # production parity
```

The design system is **"Editorial Art Catalog"**: alabaster background, deep charcoal ink, burnished gold accent, IBM Plex Serif headers + Inter body + JetBrains Mono telemetry. Tokens live in `app/globals.css`. **Please don't add new colors without discussion.**

### Adding a new tip article

Drop an MDX file at `data/tips/your-slug.mdx` with this frontmatter:

```yaml
---
title: How to do X
summary: One-sentence summary that shows on the index card.
author: Your Name
lastUpdated: 2026-05-02
tags: [proposal-writing, planning]
sponsored: false
---
```

Aim for **800+ words**, opinionated, with concrete examples. Cite real GitHub issues / mailing-list threads where relevant.

### Adding a new tech tag

Edit [`data/tech-tags.json`](./data/tech-tags.json). Each entry needs:

```jsonc
{
  "slug": "wasm",
  "label": "WebAssembly",
  "description": "1–2 sentence definition for SEO and the /tech/wasm page.",
  "aliases": ["webassembly", "wasm", "wat"],   // case-insensitive matchers for auto-tagging
  "category": "domain"   // language | framework | platform | infra | domain
}
```

Then **rerun the ingest** so existing PDFs get re-tagged: `pnpm ingest`.

### Adding a new community-archive source

Edit `lib/constants.ts → SOURCE_REPOS`. Each entry must:

- Have a permissive license on its repo (MIT / Apache-2.0 / BSD / CC-BY) — `pnpm ingest` will fail if not
- Use one of the supported layouts:
  - `Org/file.pdf` (year-scoped repo)
  - `Org/{Accepted,Rejected}/file.pdf`
  - `YYYY/Org/Proposals/{Accepted,Rejected}/file.pdf`
  - `YYYY/Org/file.pdf`

After adding, run `pnpm ingest` and commit the regenerated data + PDFs.

---

## What we don't accept

- ❌ AI-generated proposals or content
- ❌ Newsletter widgets, email-collection forms, or any user-tracking beyond the existing Vercel Analytics
- ❌ Use of Google's logos or the four-color motif (the GSoC sun mark is the only Google-trademarked element we ship, used under the GSoC brand guidelines)
- ❌ Pure-white backgrounds, generic shadcn template defaults, or anything that breaks the Editorial Art Catalog aesthetic without discussion
- ❌ Code or content reused from other projects without compatible licensing

---

## Code style

- TypeScript **strict**
- Functional React components only (no class components)
- Server components by default — only use `"use client"` when state, effects, or browser APIs require it
- Tailwind utility classes for styling — no CSS-in-JS, no styled-components
- One component per file, named exports preferred
- Run `pnpm format` before committing

---

## Code of Conduct

Be excellent to each other. We're all here to help GSoC applicants. PRs and issues that are mean-spirited, dismissive, or self-promotional get closed.

---

## Questions?

- 🐛 Bug? [Open an issue](https://github.com/PankajKumardev/GsoCDex/issues/new)
- 💡 Idea? [Discussions tab](https://github.com/PankajKumardev/GsoCDex/discussions) — or open an issue
- 🔒 Removal request (you authored a proposal here)? See [/disclosures](https://gsoc-dex.vercel.app/disclosures)

Thanks for contributing — every proposal added helps the next applicant in line. 🌻
