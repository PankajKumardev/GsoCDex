import Link from "next/link";

import { TrademarkNotice } from "@/components/TrademarkNotice";
import { Wordmark } from "@/components/Wordmark";
import { SOURCE_REPOS } from "@/lib/constants";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-app-border bg-app-surface">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[2fr_3fr]">
        <div className="flex flex-col gap-3">
          <Wordmark size="lg" />
          <p className="text-sm text-app-muted">Every accepted GSoC proposal, browsable.</p>
          <TrademarkNotice variant="footer" className="mt-2" />
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <FooterCol heading="Explore">
            <FooterLink href="/browse">All proposals</FooterLink>
            <FooterLink href="/org">Organizations</FooterLink>
            <FooterLink href="/tech">Tech tags</FooterLink>
          </FooterCol>
          <FooterCol heading="Learn">
            <FooterLink href="/tips">Tips</FooterLink>
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/contribute">Contribute</FooterLink>
          </FooterCol>
          <FooterCol heading="Legal">
            <FooterLink href="/disclosures">Disclosures</FooterLink>
            <FooterLink href="/submit">Submit a proposal</FooterLink>
          </FooterCol>
        </div>
      </div>

      <div className="border-t border-app-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-app-muted md:flex-row md:items-center md:justify-between">
          <p>
            Proposals curated from community archives by{" "}
            {SOURCE_REPOS.map((r, i) => (
              <span key={r.id}>
                {i > 0 ? ", " : ""}
                <Link
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-app-border underline-offset-2 hover:text-app-ink hover:decoration-app-accent"
                >
                  {r.owner}
                </Link>
              </span>
            ))}{" "}
            and contributors.
          </p>
          <p className="font-mono">© {year} GSoCDex</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-mono text-[10px] uppercase tracking-wider text-app-muted">{heading}</h3>
      <ul className="flex flex-col gap-1.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-app-ink/80 hover:text-app-accent"
      >
        {children}
      </Link>
    </li>
  );
}
