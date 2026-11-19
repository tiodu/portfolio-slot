/**
 * The five case studies, in the order they appear on the home page.
 * Summaries are taken from eduardodesouza.me. Do not invent metrics,
 * clients, or results. Gaps on the pages are marked [TODO].
 */
export type CaseStudy = {
  slug: string;
  title: string;
  summary: string;
};

export const caseStudies: readonly CaseStudy[] = [
  {
    slug: "wa-fantasy-pickem",
    title: "WA Fantasy Pick'em",
    summary:
      "Designed the end-to-end UX for a real-money fantasy sports platform serving B2B operators globally. Sports Provider of the Year 2024.",
  },
  {
    slug: "wa-belloa-design-system",
    title: "WA Belloa Design System",
    summary:
      "Built and scaled a multi-brand design system powering sportsbook, casino, and fantasy products across WA Technology's operator portfolio.",
  },
  {
    slug: "roadready",
    title: "RoadReady",
    summary:
      "End-to-end brand identity and product design for a driving test preparation app — from naming and visual identity through to UX and launch.",
  },
  {
    slug: "free-to-play-fantasy-games-library",
    title: "Free to Play Fantasy Games Library",
    summary:
      "Designed a library of free-to-play fantasy formats for B2B operators — including Player Reveals and Predict 6 — enabling rapid deployment of retention-focused game experiences across sportsbook platforms globally.",
  },
  {
    slug: "belloa-back-office-redesign",
    title: "Belloa Back Office Redesign",
    summary:
      "Led a three-phase redesign of WA Technology's back office — transforming a legacy admin panel into a role-based, research-led platform for internal teams and operator clients.",
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug);
}
