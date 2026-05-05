<!--
  Thanks for opening a PR! Please fill in the relevant section below.
  Delete sections that don't apply.
-->

## What kind of contribution is this?

<!-- Tick whichever applies -->

- [ ] 📑 Adding a new accepted GSoC proposal
- [ ] 🛠️ Fixing metadata (title, contributor name, tech tags, org info)
- [ ] 🎨 UI / design change
- [ ] ✍️ New tips article
- [ ] 🏷️ New tech tag in the controlled vocabulary
- [ ] 📚 New community-archive source repo
- [ ] 🐛 Bug fix
- [ ] 📝 Docs / README change
- [ ] Other (describe below)

---

## 📑 If this PR adds a proposal

> Skip this whole section if your PR is something else.

### Proposal details

- **Year:** <!-- e.g. 2025 -->
- **Organization:** <!-- e.g. SymPy -->
- **Contributor (your full name or original author's name):**
- **GitHub username (optional):**
- **Source URL** (where the PDF originally lives, e.g. an existing community archive or your own GitHub):

### Confirmations

- [ ] The proposal was **accepted** to GSoC (rejected proposals aren't in scope yet)
- [ ] I have permission to redistribute this PDF (I authored it, OR the original author is OK with it)
- [ ] The PDF is committed at `public/proposals/{year}/{Org}/{slug}.pdf`
- [ ] I appended the entry to `data/proposals.json` matching the schema in `lib/schema.ts`
- [ ] I bumped `proposalCount` and `yearsParticipated` in `data/orgs.json` (or added a new org entry if it wasn't there)
- [ ] I ran `pnpm typecheck` and `pnpm verify` locally — both passed
- [ ] I ran `pnpm build-search-index` so the search index includes my entry
- [ ] I read [the trademark + author rights policy](https://gsoc-dex.vercel.app/disclosures)
- [ ] I'm OK with my contribution being licensed under the project's MIT license

### Tech tags I assigned

<!-- List the slugs from data/tech-tags.json. Cap at 6. -->

- 

---

## 🎨 If this PR changes the UI

- [ ] I tested at **mobile (375 / 390px)** and **desktop (1280px)**
- [ ] I haven't introduced new pure-white backgrounds, harsh black text, or non-Editorial-Art-Catalog colors
- [ ] All interactive targets are **≥ 44 × 44 px** on mobile
- [ ] I ran `pnpm verify` and it passed (no newsletter / trademark violations)
- [ ] PDF.js is still **not** in the homepage chunk graph (verified via `pnpm build` output)

### Screenshots / before-after

<!-- Drag images here. Mobile + desktop both, please. -->

---

## ✍️ If this PR adds a tips article

- [ ] Article is **800+ words**
- [ ] Frontmatter complete: title, summary, author, lastUpdated, tags
- [ ] Opinionated and concrete (cites real examples, not generic advice)
- [ ] No AI-generated content
- [ ] No newsletter / email-collection language

---

## ✅ Pre-submit checks

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm verify` passes
- [ ] `pnpm build` succeeds
- [ ] (If UI change) tested at 375 / 390 / 1280 viewports

---

## Anything else maintainers should know?

<!-- Context, open questions, things you weren't sure about. -->
