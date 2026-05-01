import { Suspense } from "react";

import { BrowseClient } from "@/components/BrowseClient";
import {
  getAllOrgs,
  getAllProposals,
  getAllTechTags,
  getYearsCovered,
} from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Browse all proposals",
  description:
    "Search and filter every accepted Google Summer of Code proposal indexed on GSoCDex. Filter by year, organization, technology, and contributor.",
  path: "/browse",
});

export default function BrowsePage() {
  const proposals = getAllProposals();
  const orgs = getAllOrgs();
  const techTags = getAllTechTags();
  const years = getYearsCovered();

  return (
    <Suspense fallback={<div className="container-wide py-12">Loading…</div>}>
      <BrowseClient proposals={proposals} orgs={orgs} techTags={techTags} years={years} />
    </Suspense>
  );
}
