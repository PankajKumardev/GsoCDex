/**
 * Capture screenshots of key pages at mobile (375px) and desktop (1280px).
 * Used to populate the PR walkthrough — not part of the runtime build.
 */

import puppeteer, { type Browser } from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const OUT = "/opt/cursor/artifacts";
const BASE = "http://localhost:3000";

const PAGES = [
  { name: "homepage", url: "/" },
  { name: "browse", url: "/browse" },
  { name: "proposal", url: "/p/2025/sympy/2025-sympy-anonymous-contributor" },
  { name: "year-2025", url: "/year/2025" },
  { name: "org-sympy", url: "/org/sympy" },
  { name: "tech-python", url: "/tech/python" },
  { name: "tips-list", url: "/tips" },
  { name: "tip-detail", url: "/tips/how-to-pick-a-gsoc-org" },
  { name: "about", url: "/about" },
  { name: "disclosures", url: "/disclosures" },
];

const VIEWPORTS = [
  { id: "mobile", width: 375, height: 812, deviceScaleFactor: 2 },
  { id: "desktop", width: 1280, height: 900, deviceScaleFactor: 1 },
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser: Browser = await puppeteer.launch({
    executablePath: "/usr/local/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });

  for (const vp of VIEWPORTS) {
    for (const p of PAGES) {
      const page = await browser.newPage();
      await page.setViewport(vp);
      const url = `${BASE}${p.url}`;
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      } catch (err) {
        console.error(`[screenshot] ${vp.id}/${p.name} navigation failed:`, (err as Error).message);
        await page.close();
        continue;
      }
      const out = path.join(OUT, `screenshot-${p.name}-${vp.id}.png`);
      await page.screenshot({ path: out, fullPage: false });
      console.log(`[screenshot] ${out}`);
      await page.close();
    }
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
