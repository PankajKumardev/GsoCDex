import { z } from "zod";

/**
 * Schemas + types for GSoCDex data.
 * §5.2, §5.3, §5.4
 */

export const ContributorSchema = z.object({
  displayName: z.string().min(1),
  githubUsername: z.string().optional(),
});

export const ProjectLengthSchema = z.union([z.literal(90), z.literal(175), z.literal(350)]);

export const ProposalSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  year: z.number().int(),
  organization: z.string().min(1),
  orgSlug: z.string().min(1),
  contributor: ContributorSchema,
  pdfPath: z.string().min(1),
  pdfPages: z.number().int().optional(),
  pdfSizeKB: z.number().optional(),
  techTags: z.array(z.string()).default([]),
  projectLength: ProjectLengthSchema.optional(),
  status: z.literal("accepted"),
  sourceRepo: z.string().min(1),
  sourceUrl: z.string().url(),
  addedAt: z.string(),
  description: z.string().optional(),
});

export type Proposal = z.infer<typeof ProposalSchema>;

export const OrganizationSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  yearsParticipated: z.array(z.number().int()).default([]),
  proposalCount: z.number().int().default(0),
  beginnerFriendly: z.boolean().optional(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

export const TechTagSchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  /** Lowercase substrings used for auto-tagging the PDF text. */
  aliases: z.array(z.string()).default([]),
  category: z.string().optional(),
});

export type TechTag = z.infer<typeof TechTagSchema>;

export const TipFrontmatterSchema = z.object({
  title: z.string(),
  summary: z.string(),
  author: z.string().default("GSoCDex Editors"),
  lastUpdated: z.string(),
  tags: z.array(z.string()).default([]),
  sponsored: z.boolean().default(false),
  sponsorName: z.string().optional(),
});

export type TipFrontmatter = z.infer<typeof TipFrontmatterSchema>;

export interface Tip {
  slug: string;
  frontmatter: TipFrontmatter;
  content: string;
  wordCount: number;
}

export const SponsorSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().optional(),
  tagline: z.string(),
  ctaUrl: z.string().url(),
  kind: z.enum(["affiliate", "sponsor"]),
});

export type Sponsor = z.infer<typeof SponsorSchema>;

export const SponsorsConfigSchema = z.object({
  active: z.array(SponsorSchema).default([]),
  placeholders: z.array(SponsorSchema).default([]),
});

export type SponsorsConfig = z.infer<typeof SponsorsConfigSchema>;
