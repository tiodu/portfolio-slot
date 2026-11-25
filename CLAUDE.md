# portfolio-slot

Eduardo de Souza's portfolio: a Googie slot-machine hero over a neon Vegas-strip background. Spinning lands on a case study. The portfolio itself is the proof of design-engineering craft. Target: live by 31 Dec 2026.

@AGENTS.md

## Direction (decided 25 Nov 2026)
- Eduardo chose the instrument direction (PR #31, `public/instrument/`, no-build, graphite and orange). Work continues from that PR.
- The Next.js app on `main` and the Googie cabinet (PRs #27 to #30) are kept as history. Do not delete those branches or PRs.
- "Locked decisions" and "Map" below describe the Next.js app. They do not apply to the instrument unless its own PR says so.
- The portfolio is built from its own design system: tokens first, then components, documented on a `/system` page.
- Themes (decided 25 Nov 2026): "instrument" (default, the current look), "vegas" and "aero" (Frutiger Aero). Themes are data: one theme object feeds the CSS variables, then the 3D scene.
- Fonts: Google Fonts families are fine, self-hosted as latin woff2 (from @fontsource, OFL). Never link to Google's CDN: the site promises no tracking.

## Stack
- Next.js 16 App Router, React 19, TypeScript. Read `node_modules/next/dist/docs/` before using Next APIs (see AGENTS.md).
- react-three-fiber, drei, postprocessing, three. leva is for dev and `?tune` only.
- Deployed by Vercel from GitHub: every branch gets a preview.
- Scripts: `npm run dev`, `npm run build`, `npm run typecheck`, `npm test` (spin state machine tests).

## Map
- `components/cabinet/*`: the 3D cabinet, reels, lever, bulbs, strip shader background, result card.
- `lib/cabinet/machine.ts`: spin state machine (idle -> spinning -> stopping -> landed -> idle). Outcome is chosen first; reels stop left to right.
- `lib/cabinet/strip-shader.ts`: strip background fragment shader (heat haze, pulsing chromatic smear).
- `content/case-studies.ts`: all case-study copy, as typed data. `app/work/[slug]`: case-study pages.
- `public/cabinet-still.webp`, `public/strip-bg.webp`: fallbacks for loading, reduced motion and no-WebGL.

## Locked decisions (don't change without asking Eduardo)
- Cabinet look: cream front, turquoise sides, chrome, a starburst topper with warm bulbs, pink "Eduardo" / cyan "de Souza", chrome winged badge, red-ball lever.
- Navigation: each case study is a real `/work/[slug]` page. After a spin, the camera dollies into the landed reel window with a slight (~16 deg) twist, dims to dark, and the page fades up (~1800ms, skippable on any click or key). Back reverses it. List clicks get a ~200ms fade. Reduced motion gets a plain crossfade.
- Each case study has a strip of three thumbnails (videos or images) near the top.
- The result card is a modal for now.

## Hard rules
- Outcomes are content, never money. No credits, balances, odds, real-money mechanics or fake near-misses.
- Casino-style visuals (chips, dice, cards, neon, starbursts) are allowed as decoration in an opt-in theme such as "vegas". The default theme stays the instrument. No real casino or operator brand marks.
- Real operator names may appear in case-study copy and diagrams. No operator logos or brand marks unless Eduardo supplies and approves them.
- No employer logos (WA, Belloa) on the reels. Logos are fine inside case-study pages.
- Never invent case-study facts, metrics, client names or results. Write `[TODO]` and list the gaps in the PR.
- British English in site copy.
- No CMS, blog engine or backend.
- Accessibility: keyboard works everywhere (Space spins, Escape closes, visible focus), honour `prefers-reduced-motion`, and keep an aria-live announcement for results.
- Check at 1440 and 390 widths before calling anything done.

## Workflow
- Issues on GitHub are the backlog (#1 is the PRD). One small slice per branch (`feat/...`), and one PR per slice, linking its issue.
- Never deploy to production, and never touch eduardodesouza.me or its DNS, without Eduardo's explicit yes.
- Keep runs lean: small scoped changes, no unnecessary deps, no big refactors.
- Eduardo is learning design engineering. In PR descriptions, name the one concept behind the change (e.g. state machine, shader uniform, view transition) in a line or two.

## Open work (Nov 2026)
- #10 case-study pages: slice 1 (pages) in PR #18; slice 2 = the zoom transition in r3f.
- #7 match opens case study, #8 mixed-result copy, #9 konami "fear and loathing" melt, #11 easter eggs, #12 perf + a11y + launch.
- Deferred polish: cabinet wings and stickers, reel masking on mobile, real reel symbol art, on-demand rendering for the bulb chase (perf).
