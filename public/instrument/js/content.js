/*
 * All site copy for the case studies, as plain data.
 * Rule: only facts Eduardo has stated. Anything else is a visible [TODO].
 */

export const TODO = '[TODO]';

export const studies = [
  {
    n: '01',
    slug: 'belloa-back-office',
    title: 'Belloa back office redesign',
    reelLabel: 'BACK OFFICE',
    platform: 'Back office',
    scope: 'Redesign built on the Belloa design system',
    known: 'The redesign is built on the Belloa design system.',
    images: ['Back office overview, before and after', 'Design system components in use', 'Key screen with annotations'],
  },
  {
    n: '02',
    slug: 'wa-fantasy-back-office',
    title: 'WA Fantasy back office',
    reelLabel: 'FANTASY OPS',
    platform: 'Back office',
    scope: TODO,
    known: null,
    images: ['Back office overview', 'Two core workflows', 'Key screen with annotations'],
  },
  {
    n: '03',
    slug: 'pickem',
    title: "Pick'em",
    reelLabel: "PICK'EM",
    platform: 'Fantasy product',
    scope: TODO,
    known: null,
    awards: true,
    images: ["Pick'em hero screen", 'Player journey, two key steps', 'Key screen with annotations'],
  },
  {
    n: '04',
    slug: 'casino-lobby',
    title: 'Casino lobby',
    reelLabel: 'LOBBY',
    platform: 'Mobile and desktop',
    scope: 'Lobby file reorganised into atomic design for developer handoff',
    known: 'The finished mobile and desktop lobby was reorganised into atomic design so developers could pick it up cleanly.',
    images: ['Lobby on mobile and desktop', 'Atoms, molecules and organisms in the handoff file', 'Handoff screen with annotations'],
  },
];

export const awards = [
  { title: 'Sports Provider of the Year', by: 'AffPapa', year: '2024' },
  { title: 'Best Esport Platform', by: 'SiGMA Africa', year: '2025' },
];

export const bySlug = (slug) => studies.findIndex((s) => s.slug === slug);
