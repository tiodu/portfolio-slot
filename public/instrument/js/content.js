/*
 * All site copy for the case studies, as plain data.
 * Rule: only facts Eduardo has stated. Anything else is a visible [TODO].
 * Source: Eduardo's live-site copy, 25 Nov 2026 (project doc case-study-content).
 * The machine has four studies: the reels are built from eight cells, the
 * four studies twice. Changing the count means changing the reel geometry.
 */

export const TODO = '[TODO]';

export const studies = [
  {
    n: '01',
    slug: 'pickem',
    title: "WA Fantasy Pick'em",
    reelLabel: "PICK'EM",
    summary: 'Designed the end-to-end UX for a real-money fantasy sports platform serving B2B operators globally.',
    role: 'Product Design Manager',
    year: '2024',
    team: '3 designers, 1 PM, 6 engineers, over 9 months',
    platform: 'Fantasy product',
    scope: 'Full product lifecycle, from UX direction and design system architecture to internal playtesting and iteration',
    known: null,
    awards: true,
    images: ["Pick'em general navigation", 'Competitive benchmarking: DraftKings and PrizePicks references', 'Default and operator-themed views, side by side'],
  },
  {
    n: '02',
    slug: 'belloa-design-system',
    title: 'WA Belloa Design System',
    reelLabel: 'DESIGN SYSTEM',
    summary: "Built and scaled a multi-brand design system powering sportsbook, casino, and fantasy products across WA Technology's operator portfolio.",
    role: 'Product Design Manager',
    year: 'Ongoing',
    team: '3 designers, 2 PMs, 3 engineers',
    platform: 'Design system',
    scope: 'Audit, token architecture and component library across sportsbook, casino, lottery and fantasy',
    known: null,
    images: ['Before and after: isolated verticals to one system', 'Radix primitives to semantic tokens to components', 'Token explorer'],
  },
  {
    n: '03',
    slug: 'free-to-play',
    title: 'Free to Play Fantasy Games Library',
    reelLabel: 'FREE TO PLAY',
    summary: 'Designed a library of free-to-play fantasy formats for B2B operators, including Player Reveals and Predict 6, enabling rapid deployment of retention-focused game experiences across sportsbook platforms globally.',
    role: 'Product Design Manager',
    year: '2024',
    team: '2 designers, 1 PM, 4 engineers, over 6 months',
    platform: 'Fantasy product',
    scope: 'Two game formats, Player Reveals and Predict 6, and the shared components behind them',
    known: null,
    images: ['Player Reveals, card selection', 'Design language: dark surfaces and athlete photography', 'Predict 6, fixtures and leaderboard'],
  },
  {
    n: '04',
    slug: 'road-ready',
    title: 'RoadReady',
    reelLabel: 'ROADREADY',
    summary: 'End-to-end brand identity and product design for a driving test preparation app, from naming and visual identity through to UX and launch.',
    role: 'Branding and Product Design Lead',
    year: '2024',
    team: '1 designer, 1 engineer, 2 stakeholders, over 3 months',
    platform: 'Brand and product',
    scope: 'Brand identity, information architecture, a lean design system and handoff to a Vue.js build',
    known: null,
    images: ['RoadReady brand and logo', 'Brand guidelines, 17 pages', 'Search-to-book flow'],
  },
];

export const awards = [
  { title: 'Sports Provider of the Year', by: 'AffPapa', year: '2024' },
];

export const bySlug = (slug) => studies.findIndex((s) => s.slug === slug);
