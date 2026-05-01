import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Submit a proposal",
  description:
    "Submitted a GSoC proposal? Add it to GSoCDex. Owner reviews each submission and links back to the original.",
  path: "/submit",
});

export default function SubmitPage() {
  const tallyId = process.env.NEXT_PUBLIC_TALLY_FORM_ID ?? "";

  return (
    <article className="container-content pb-24 pt-8 prose-tips">
      <p className="font-mono text-[11px] uppercase tracking-wider text-app-muted">Submit</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app-ink md:text-4xl">
        Add your accepted proposal
      </h1>
      <p className="mt-3">
        Submitted a GSoC proposal that was accepted? Share it with future applicants by adding
        it to GSoCDex. Owner reviews every submission, runs the ingest pipeline, and deploys
        — usually within a few days.
      </p>

      {tallyId ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-app-border bg-white shadow-card">
          <iframe
            src={`https://tally.so/embed/${tallyId}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`}
            loading="lazy"
            width="100%"
            height="800"
            title="Submit a GSoC proposal"
          />
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-app-border bg-app-surface p-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-app-muted">
            Submission form not configured yet
          </p>
          <h2 className="mt-2 text-base font-semibold text-app-ink">
            We&apos;re still wiring up the submission form
          </h2>
          <p className="mt-2 text-sm text-app-muted">
            In the meantime, you can submit by opening a pull request or issue at{" "}
            <a
              href="https://github.com/PankajKumardev/GsoCDex/issues/new"
              target="_blank"
              rel="noreferrer"
              className="text-app-accent hover:underline"
            >
              github.com/PankajKumardev/GsoCDex
            </a>
            . Include the year, organization, your name, and a link to the PDF.
          </p>
        </div>
      )}

      <h2>What we accept</h2>
      <ul>
        <li>Accepted GSoC proposals (any year)</li>
        <li>Original PDF files (≤30 MB)</li>
        <li>Permission to redistribute (we&apos;ll honor takedowns within 7 days)</li>
      </ul>

      <h2>What we don&apos;t accept</h2>
      <ul>
        <li>Rejected proposals (yet — coming in v2)</li>
        <li>Drafts or work-in-progress proposals</li>
        <li>AI-generated content</li>
      </ul>

      <p className="mt-8 rounded-lg bg-app-accent-subtle px-4 py-3 text-sm text-app-accent-hover">
        We never share your email with third parties. The email field is purely so we can
        reach you with follow-up questions if your submission needs clarification.
      </p>
    </article>
  );
}
