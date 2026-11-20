/**
 * The five case studies, in home-page order.
 * Copy is lifted from eduardodesouza.me and edited lightly into problem,
 * role, process, and outcome. British English. Do not invent metrics,
 * clients, or results. Gaps are marked [TODO].
 */

export type InlinePart = string | { readonly text: string; readonly href: string };

export type StudyBlock =
  | { readonly kind: "p"; readonly parts: readonly InlinePart[] }
  | { readonly kind: "h"; readonly text: string }
  | { readonly kind: "ul"; readonly items: readonly string[] }
  | {
      readonly kind: "pairs";
      readonly items: readonly { readonly before: string; readonly after: string }[];
    }
  | { readonly kind: "todo"; readonly text: string };

export type CaseStudy = {
  slug: string;
  title: string;
  summary: string;
  tags: readonly string[];
  role: string;
  team: string;
  duration: string;
  year: string;
  thumbnails: readonly [string, string, string];
  problem: readonly StudyBlock[];
  roleBody: readonly StudyBlock[];
  process: readonly StudyBlock[];
  outcome: readonly StudyBlock[];
};

function p(...parts: InlinePart[]): StudyBlock {
  return { kind: "p", parts };
}

function h(text: string): StudyBlock {
  return { kind: "h", text };
}

function ul(items: readonly string[]): StudyBlock {
  return { kind: "ul", items };
}

function pairs(
  items: readonly { readonly before: string; readonly after: string }[],
): StudyBlock {
  return { kind: "pairs", items };
}

function todo(text: string): StudyBlock {
  const body = text.startsWith("[TODO]") ? text : `[TODO] ${text}`;
  return { kind: "todo", text: body };
}

export const caseStudies: readonly CaseStudy[] = [
  {
    slug: "pickem",
    title: "WA Fantasy Pick'em",
    summary:
      "Designed the end-to-end UX for a real-money fantasy sports platform serving B2B operators globally. Sports Provider of the Year 2024.",
    tags: ["iGaming", "Fantasy", "B2B"],
    role: "Product Design Manager",
    team: "3 Designers, 1 PM, 6 Engineers",
    duration: "9 Months",
    year: "2024",
    thumbnails: [
      "Competitive benchmarking — DraftKings, PrizePicks reference screens",
      "Default purple theme",
      "F12 green theme",
    ],
    problem: [
      p(
        "Most sportsbooks were built for a different era — designed for desktop, for experienced bettors, and for markets measured in decimal odds. The modern fan, one who follows LeBron or Messi rather than a team, was largely ignored.",
      ),
      p(
        "B2C disruptors like Underdog Fantasy and PrizePicks had proven that simplifying betting into a binary More or Less choice could unlock an entirely new audience. No B2B equivalent existed. The opportunity was to build the first white-label Pick'em engine that any operator could plug in and own.",
      ),
    ],
    roleBody: [
      p(
        "My role spanned the full product lifecycle: from the initial UX direction and design system architecture to internal playtesting and iteration.",
      ),
      p(
        "This project is the result of a talented cross-functional team — designers, engineers, and product leads working in close alignment over nine months.",
      ),
    ],
    process: [
      h("Benchmarking"),
      p(
        "We conducted competitive analysis against the leading B2C disruptors. DraftKings Pick 6 informed our navigation and player card hierarchy. PrizePicks had perfected the high-velocity betslip — fast, addictive, frictionless. Rather than copy either, we synthesised what worked and designed a B2B-native version: fully themeable, delivered as an iFrame through existing casino aggregators.",
      ),
      h("Design iteration"),
      p(
        "What followed was several sprints of design exploration, internal playtesting, and iteration — building the Pick'em library screen by screen. Player cards, bet slips, multiplier displays, outcome states. Each component tested internally before moving to the next. The challenge was keeping the experience feeling like a game at every touchpoint, not a financial product.",
      ),
      h("The visual foundation"),
      p(
        "Because Pick'em was a B2B product, multi-brand scalability was non-negotiable. We adopted purple as the primary accent and built on Radix UI colours, pairing it with Radix's Mauve as our neutral base.",
      ),
      h("Pizza Logic"),
      p(
        "The interface featured multiple overlapping layers, panels, and drawers. To maintain consistent depth and contrast across any white-label theme, we coined the Pizza Logic: the bottom layer uses the darkest Radix surface tokens, and as components stack on top — like toppings — each layer steps one level lighter up the scale. WCAG-compliant contrast at every depth, across every brand.",
      ),
      ul([
        "01 Background",
        "02 Base",
        "03 Surface",
        "04 Elevated",
        "05 High Contrast",
        "06 Icon & Text",
        "07 Accent",
        "08 Overlay",
      ]),
      h("Token architecture"),
      p(
        "Our initial framework required 84 tokens to style a new white label. The complexity Pick'em introduced became the catalyst for a token reduction initiative I led across the company — bringing the architecture down to a 44-token semantic layer that could support rapid operator onboarding without breaking.",
      ),
      p({
        text: "Read more in the WA Belloa Design System case study",
        href: "/work/belloa-ds",
      }),
    ],
    outcome: [
      p(
        "We launched the first Pick'em brand for F12, our primary Brazilian client, under the name Chute Certo. F12 had been struggling to cross-sell players from their Casino to their Sportsbook — a 5% drop in that conversion funnel. Chute Certo bridged that gap: familiar enough for casino players, engaging enough to keep them.",
      ),
      todo(
        "The 5% casino-to-sportsbook figure is not defined further on the source page (conversion rate or size of the drop).",
      ),
      p(
        "With the foundation live, Pick'em is now in the pipeline for Manat365 in Azerbaijan, Poligon in Turkey, and SpinPokio in Australia — validating the scalability of the system we built.",
      ),
      p(
        "Winning ",
        {
          text: "Sports Provider of the Year 2024",
          href: "https://affpapa.com/affpapa-awards-2024/sports-provider-of-the-year/",
        },
        " was a reflection of that collective effort.",
      ),
      p({
        text: "View live: F12 Chute Certo",
        href: "https://f12.bet.br/modules/pickem/",
      }),
    ],
  },
  {
    slug: "belloa-ds",
    title: "WA Belloa Design System",
    summary:
      "Built and scaled a multi-brand design system powering sportsbook, casino, and fantasy products across WA Technology's operator portfolio.",
    tags: ["Design System", "iGaming", "B2B"],
    role: "Product Design Manager",
    team: "3 Designers, 2 PMs, 3 Engineers",
    duration: "Ongoing",
    year: "[TODO]",
    thumbnails: [
      "WA Belloa Design System",
      "Audit spread — components, headers, footers mapped across WA product ecosystem",
      "[TODO]",
    ],
    problem: [
      p(
        "WA Technology is a B2B iGaming provider offering white-label templates across sportsbook, casino, lottery, and fantasy verticals. Following a series of company mergers, the product ecosystem was highly fragmented — each acquired platform had its own tech stack, its own legacy components, and in many cases no original design files to work from.",
      ),
      h("The challenge"),
      p(
        "Before Belloa, our team of three designers operated in a reactive environment. We were working without source files, scraping live screens with plugins just to have something to edit. Each product vertical had its own developers working in isolation, building on incompatible legacy libraries with no shared standards.",
      ),
      p(
        "The problem wasn't just visual inconsistency — it was structural. We needed to fix the foundation before we could build anything that would last.",
      ),
      h("Before Belloa — isolated verticals"),
      ul([
        "Sportsbook / Casino. Betstudios team. Own library → React. Source files missing.",
        "Fantasy. Ukrainian FE devs. Legacy stack. No source files.",
        "Platform. Unknown team. React? .NET? No oversight.",
        "Lottery. Estonian FE. Unclear stack. Discontinued.",
        "Affiliates. NETEC team. Third-party. Discontinued.",
      ]),
      p(
        "Belloa design system: Sportsbook / Casino on Radix and semantic tokens, in React. Fantasy on a shared component library. Platform on a 44-token architecture.",
      ),
    ],
    roleBody: [
      p(
        "Product Design Manager, with 3 designers, 2 PMs and 3 engineers. The work is ongoing.",
      ),
      todo(
        "Personal responsibilities are not stated on the source page beyond the role and team line.",
      ),
    ],
    process: [
      h("Audit and foundation"),
      p(
        "We started by mapping everything that existed. A system-wide audit across every front-end product under the WA umbrella — cataloguing components, headers, footers, interaction patterns, and duplicated logic. From that audit, we retroactively converted the live products into a foundational set of Figma components, giving us a baseline to work from rather than a blank canvas.",
      ),
      p(
        "We also mapped how different verticals interacted — particularly how fantasy games were embedded as iFrames inside sportsbook and casino platforms — to ensure any new component architecture would be compatible across the stack.",
      ),
      h("The Radix decision"),
      p(
        "Rather than build primitives from scratch, we made the strategic decision to adopt Radix UI as the foundation. Radix provides unstyled, accessible React primitives built on ARIA best practices — we could layer iGaming-specific styling on top without reinventing accessibility or fighting browser behaviour.",
      ),
      p(
        "This eliminated an entire class of problems and meant every WA product and white-label client inherited a robust accessibility foundation from day one.",
      ),
      todo(
        "The library diagram (Radix UI, the WA Design System, and the SBK, casino, platform, and fantasy libraries) is not redrawn here.",
      ),
      h("Pick'em as the proving ground"),
      p(
        "In parallel with the audit, the team was designing Pick'em — a greenfield fantasy product built entirely from scratch. That clean slate made it the perfect testing environment for the new component library. Every decision we made in Belloa was stress-tested through Pick'em in real time. It worked well enough that Pick'em became the internal gold standard for how all other verticals should be built.",
      ),
      h("Building while shipping"),
      p(
        "A design system is never built in isolation. While we were establishing the token architecture, the business still needed to move. We ran a dual-track approach — designing and delivering new white-label projects concurrently with building the Belloa library. Each new operator became a live test of the system's flexibility.",
      ),
      h("Token architecture"),
      p(
        "The token system went through three distinct phases as the platform matured and engineering moved to React:",
      ),
      h("V1.0"),
      p(
        "84 tokens. Functional but brittle — every new white label required significant manual rework.",
      ),
      h("V2.0"),
      p(
        "68 tokens. First reduction pass, prompted by Pick'em's complexity. Cleaner but still not scalable.",
      ),
      h("V3.0"),
      p(
        "44 tokens. A full semantic restructure. Brand logic decoupled from functional logic. Rapid operator onboarding, no breaking changes.",
      ),
      p(
        "The refined architecture follows a tiered flow: Radix UI primitives map into semantic tokens, which drive themed components. Brand-specific logic is fully decoupled from core functional logic — any operator can be onboarded without touching the system's foundations.",
      ),
      p("800 Colors/Purple/8 #7c3aed."),
      todo(
        "The full semantic token table (surface, content, action, state, border, and status) is not included.",
      ),
      h("Decoupling"),
      p(
        "A significant engineering initiative — Decoupling — ripped all interface modules out of the legacy architecture and rebuilt them properly in React. For the design team, this was the unlock we had been waiting for.",
      ),
      p(
        "We rebuilt every component in Figma from the ground up, mirroring the new React architecture 1:1. For the first time, we had the technical capacity to introduce proper variants for complex modules — headers, footers, navigation blocks — without legacy CSS fighting every change.",
      ),
    ],
    outcome: [
      ul([
        "Transformed a disjointed post-merger ecosystem into a unified product design language.",
        "Reduced token architecture from 84 to 44 — accelerating white-label onboarding across 15+ operators globally.",
        "Figma components mirror React architecture 1:1, eliminating a full class of QA errors.",
        "Shifted the design team from reactive screen-scrapers to a proactive, empowered design organisation.",
      ]),
      p(
        "Belloa is still evolving. Token documentation via Storybook and Supernova is underway. The system that started as an audit of broken screens now powers white-label platforms across Europe, Brazil, and beyond — and it's built to keep scaling.",
      ),
    ],
  },
  {
    slug: "roadready",
    title: "RoadReady",
    summary:
      "End-to-end brand identity and product design for a driving test preparation app — from naming and visual identity through to UX and launch.",
    tags: ["Branding", "Product", "Freelance"],
    role: "Branding & Product Design Lead",
    team: "1 Designer, 1 Engineer, 2 Stakeholders",
    duration: "3 Months",
    year: "2024",
    thumbnails: [
      "RoadReady instructors",
      "Market landscape — learner and instructor behavioural patterns",
      "Sitemap and wireframes — public vs member-only zones, Search-to-Book journey",
    ],
    problem: [
      p(
        "The Irish learner driver market was fragmented and outdated — still relying on word of mouth and phone calls, with no transparent pricing, no verified reviews, and no easy way for students to find and book instructors. The gap was obvious. Nobody had built a modern, trust-first platform for it.",
      ),
      p(
        "The mission was to build a peer-to-peer marketplace where instructors and students manage everything directly — no institutional middleman, no friction. A platform that gave both sides full ownership of their relationship.",
      ),
    ],
    roleBody: [
      p(
        "Branding & Product Design Lead, with 1 designer, 1 engineer and 2 stakeholders, over 3 months in 2024.",
      ),
      p(
        "I built a lean Figma component library to directly support the engineer's Vue.js build. Handoff fidelity was the priority — every component had a clear state, documented behaviour, and a named token.",
      ),
    ],
    process: [
      h("Research"),
      p(
        "To design a healthy marketplace, both sides had to work. We ran discovery interviews and mapped behavioural patterns for learners and instructors before a single wireframe was drawn.",
      ),
      h("The learner"),
      p(
        "Digital native. Wants a mobile-first experience with transparent pricing and verified reviews. Trust is the deciding factor.",
      ),
      h("The instructor"),
      p(
        "Independent solopreneur. Needs a lightweight tool to manage schedule, payments, and students — without administrative overhead.",
      ),
      h("Brand identity"),
      p(
        "The initial logo concept — a Roundabout R — had energy and relevance but was too close to Revolut's redesigned mark. A critical risk for a product built on trust. I went back to research.",
      ),
      p(
        "The breakthrough came through abstraction: studying European road infrastructure and SatNav interfaces, then translating the geometric language of road mesh grids into a modular brand system. Clean, distinctive, and entirely ownable.",
      ),
      p(
        "The full brand guidelines ran to 17 pages — logo, typography, colour, patterns, and application examples. Everything the engineer needed to build with confidence from day one.",
      ),
      h("Information architecture"),
      p(
        "I developed the site map and low-fidelity wireframes in parallel with the branding work — defining the boundary between public and member-only content early to prevent scope creep.",
      ),
      p(
        "The core flow was Search-to-Book. A location-based suggestion dropdown let students find instructors without friction. On a three-month timeline, we skipped formal usability testing in favour of heuristic analysis and proven mental models — borrowing Calendly-style booking patterns that users already understood.",
      ),
      h("Design system and handoff"),
      p(
        "Happy path flows were annotated in high-fidelity, covering primary actions and key edge cases. Weekly stakeholder sessions kept the build aligned with the original vision — the launch was true to the design spec.",
      ),
    ],
    outcome: [
      ul([
        "Zero-to-one platform launched in 3 months.",
        "Live and operational at getmeroadready.ie — connecting learner drivers with certified instructors across Ireland.",
        "Full brand system: 17-page guidelines, logo, typography, colour, and component library.",
        "Handoff fidelity: Figma components mapped 1:1 to Vue.js build with no design review cycles required post-launch.",
      ]),
      p(
        "RoadReady was a reminder that constraints produce clarity. Three months, one engineer, two stakeholders — and a product that launched on time, on spec, and is still running. Sometimes the best design process is a focused one.",
      ),
    ],
  },
  {
    slug: "f2p-library",
    title: "Free to Play Fantasy Games Library",
    summary:
      "Designed a library of free-to-play fantasy formats for B2B operators — including Player Reveals and Predict 6 — enabling rapid deployment of retention-focused game experiences across sportsbook platforms globally.",
    tags: ["iGaming", "Fantasy", "B2B"],
    role: "Product Design Manager",
    team: "2 Designers, 1 PM, 4 Engineers",
    duration: "6 Months",
    year: "2024",
    thumbnails: [
      "Player Reveals — card selection state",
      "Design language — dark surfaces, athlete photography, colour system",
      "Predict 6 — fixture selection screen",
    ],
    problem: [
      p(
        "Retention is the hardest problem in iGaming. Operators spend heavily to acquire players, then watch engagement drop off between major sporting events. Free-to-play games — low-stakes, socially shareable, no deposit required — had proven effective at keeping casual audiences engaged. But WA Technology had no native offering. Operators were cobbling together third-party tools that didn't match their brand and couldn't be customised at scale.",
      ),
      p(
        "The brief was to build a library of white-label free-to-play formats that any operator could deploy rapidly — fully themeable through the Belloa design system, compatible with existing sportsbook and casino infrastructure, and genuinely fun to play. Player Reveals and Predict 6 were the two formats chosen to lead the library.",
      ),
    ],
    roleBody: [
      p(
        "Product Design Manager, with 2 designers, 1 PM and 4 engineers, over 6 months in 2024.",
      ),
      todo(
        "Personal responsibilities are not separated from the team's on the source page.",
      ),
    ],
    process: [
      h("Player Reveals"),
      p(
        "Player Reveals is a card-flip prediction game. Before a match, players are shown a set of athlete cards face-down and must predict whether a player will hit a stat threshold — goals, assists, points — before the card flips to reveal the outcome. The format borrows the dopamine loop of collectible card mechanics: the reveal moment is the hook.",
      ),
      p(
        "The challenge was designing a reveal that felt earned. We went through multiple motion explorations — peel, flip, shatter — before settling on a clean 3D card flip that communicated finality without over-engineering the transition. The stat display beneath the reveal needed to be immediately legible under the emotional weight of the moment.",
      ),
      h("Design direction"),
      p(
        "Both games needed to feel like products in their own right — not features bolted onto a sportsbook. We established a visual language built around athlete photography, strong typographic hierarchy, and sport-coded colour. The dark surface system from Pick'em carried over, keeping the Belloa token architecture intact while letting each operator apply their own brand on top.",
      ),
      h("AI feedback loop"),
      p(
        "One of the more experimental parts of this project was integrating an AI-assisted feedback loop into the design process. We used generative tools to rapidly prototype visual variations of the card states and reveal animations — compressing what would have been multi-day explorations into hours.",
      ),
      p(
        "The output wasn't production-ready, but it accelerated alignment with stakeholders by making concepts tangible earlier. It shifted conversations from abstract direction to concrete tradeoffs — which is where the real design decisions happen.",
      ),
      h("Predict 6 and the unified library"),
      p(
        "Predict 6 is a pre-match prediction game: players pick the outcomes of six events from an upcoming fixture list and submit their entry before kick-off. It's a format with a long pedigree in football — familiar enough that acquisition cost is low, structured enough to drive weekly repeat engagement. Our version was built as a modular template: the fixture feed, the entry form, the results screen, and the leaderboard all exist as independent components that operators can mix and configure.",
      ),
      p(
        "Designing both games in parallel revealed natural opportunities for shared infrastructure. Entry confirmation patterns, result state displays, and the leaderboard UI were abstracted into reusable components that now sit in the Belloa library — available to any future free-to-play format we build.",
      ),
      h("Securing buy-in"),
      p(
        "Free-to-play doesn't generate direct revenue — which made internal buy-in harder to secure than for a conversion-focused product. The business case rested on retention and cross-sell data: operators who kept players engaged between live events saw measurably higher lifetime value.",
      ),
      todo("No figure is published for the lifetime-value claim."),
      p(
        "Framing the library as infrastructure rather than a feature was the move that landed it. These weren't two games — they were the foundation of a scalable retention toolkit. That reframe shifted the conversation from \"is this worth building?\" to \"how quickly can we get this to operators?\"",
      ),
    ],
    outcome: [
      ul([
        "Two free-to-play game formats shipped: Player Reveals and Predict 6.",
        "Reusable component set added to Belloa — shared entry, result, and leaderboard patterns available across all future formats.",
        "Deployed across multiple operator brands with zero bespoke engineering work per client.",
        "Established the foundation for an ongoing free-to-play library — a scalable retention toolkit rather than a one-off feature.",
      ]),
      p(
        "The free-to-play library proved that retention products don't need to be complex to be effective — they need to be fast, familiar, and fun. By building on the Belloa foundation, we delivered two polished game formats without reinventing the design system. The infrastructure scales. The games don't need to.",
      ),
    ],
  },
  {
    slug: "back-office",
    title: "Belloa Back Office Redesign",
    summary:
      "Led a three-phase redesign of WA Technology's back office — transforming a legacy admin panel into a role-based, research-led platform for internal teams and operator clients.",
    tags: ["Product Design", "iGaming", "B2B"],
    role: "Product Design Manager",
    team: "2 Designers, 1 PM",
    duration: "6 Months",
    year: "2024-2025",
    thumbnails: [
      "Belloa Back Office legacy interface before redesign",
      "Belloa Back Office phase 1 structural redesign output",
      "Player Information",
    ],
    problem: [
      p(
        "The Belloa Back Office is the administrative hub used daily by WA Technology's internal operations teams and operator clients. As the platform scaled, the interface had become a liability — built on a legacy INSPINIA framework with dense form layouts, 11px Arial type, dark sidebars, and zero design coherence. Staff were slow to onboard. Operators flagged usability issues. The product didn't reflect the quality of what WA Technology had become.",
      ),
      p(
        "The back office was never designed — it accumulated. Features were layered onto a legacy admin framework over years, resulting in a dense, visually inconsistent interface that operators and internal staff had simply learned to tolerate. Navigation had no clear hierarchy. Interaction states were undefined. The visual language was disconnected from everything WA Technology had been building towards with the Belloa Design System.",
      ),
      p(
        "The goal wasn't cosmetic. It was to make a complex, multi-role platform feel trustworthy and fast — and to lay the groundwork for a scalable, role-based experience as the operator portfolio grew.",
      ),
    ],
    roleBody: [
      p(
        "This case study covers a three-phase redesign I led across 2025, built on a foundation of user research, systematic component work, and close alignment with the WA Belloa Design System.",
      ),
      todo(
        "The timeline is inconsistent on the source page: the meta line says 6 months and 2024-2025, the overview says the redesign was led across 2025, and Phase 3 is marked June 2025 – ongoing.",
      ),
    ],
    process: [
      h("Phase 1 – structural foundation"),
      p("Jan-Feb 2025 · Completed"),
      p(
        "The first phase tackled the most immediate pain point: navigation. The legacy side menu used a dark #253137 sidebar with small unlabelled icons, no interaction states, and no search. It had grown organically and become difficult to scan.",
      ),
      p(
        "I defined the design direction for this phase entirely — the structural approach to the new sidebar, the light-mode Belloa-aligned header, menu search, and interaction states for hover, active, and collapsed. I also introduced a date and time component to the header, a frequently referenced element that had been inconsistently handled across the platform.",
      ),
      p(
        "The contrast between the legacy interface and Phase 1 output established the visual and structural baseline for everything that followed.",
      ),
      h("Phase 2 – research and refinement"),
      p("Mar-May 2025 · Completed"),
      p(
        "With the structural foundation in place, I shifted focus to understanding users before designing further.",
      ),
      p(
        "I led a full research cycle: conducting one-on-one interviews with six participants — five internal users across operations, account management, business intelligence, customer support, and engineering, plus one operator client (F12.bet, Brazil) — followed by two affinity synthesis sessions in FigJam. The team wrote and clustered insights bottom-up, then worked through Journey Mapping and \"How Might We\" framing to identify the highest-priority pain points.",
      ),
      p(
        "A recurring theme emerged from the research: users were losing confidence at feedback moments. Form submissions, error states, confirmation popups — the interface gave no reliable signal that actions had succeeded or failed. Operators in particular described having to refresh pages to verify whether something had worked.",
      ),
      p(
        "This shaped the Phase 2 design output directly: redesigned feedback and info popups, new hover states for buttons, tables, and form elements, and a more consistent treatment of interactive components throughout. The affinity diagram became a shared reference for the wider team when prioritising Phase 3.",
      ),
      todo("The affinity-board notes are not included."),
      h("Phase 3 – role-based UX"),
      p("June 2025 – Ongoing"),
      p(
        "Phase 3 introduced a more strategic layer: designing the back office around the specific roles that use it, beginning with the Customer Support persona. Working from a reference document curated by the Product Manager, I directed a role-informed experience that ensured the most relevant pages for this user type were coherent, navigable, and appropriately scoped.",
      ),
      p(
        "Alongside the role-based work, Phase 3 delivered a significant set of platform-wide improvements.",
      ),
      pairs([
        {
          before: "Frequently used pages were buried in long navigation trees.",
          after:
            "Added a Favourites section at the top of the menu so users can pin high-frequency destinations.",
        },
        {
          before: "Navigation visuals felt dated and difficult to parse at speed.",
          after:
            "Modernised iconography and refined selected / hover / unselected states for faster scanning.",
        },
        {
          before:
            "Search was limited to menu context and could not support broader discovery.",
          after:
            "Introduced global header search, separate from menu search, to improve cross-module findability.",
        },
        {
          before: "Users lacked orientation when moving across deeper pages.",
          after:
            "Added breadcrumb navigation below the header to preserve context and reduce back-and-forth.",
        },
        {
          before: "Profile and logout actions were fragmented across the interface.",
          after:
            "Consolidated account actions into a single avatar dropdown for cleaner task flow.",
        },
        {
          before:
            "Visual consistency varied between modules and reduced interface trust.",
          after:
            "Standardised accent colour (#5B5BD6), 14px Inter body type, input fields, and tabs across desktop views.",
        },
      ]),
      h("Player Information"),
      p(
        "Consolidated identity, account, and balance data in one role-prioritised workflow view.",
      ),
      h("Account Actions"),
      p(
        "Reduced support friction with clearer action grouping and more predictable button hierarchy.",
      ),
      h("Search and Filters"),
      p(
        "Improved discovery with consistent search placement and clearer filter behaviour.",
      ),
      h("Navigation + Breadcrumb"),
      p(
        "Made cross-module movement easier with contextual breadcrumbs and scoped navigation states.",
      ),
      h("Feedback and Confirmation"),
      p(
        "Strengthened trust by making success, warning, and error responses explicit at key moments.",
      ),
      h("Role-Based Surface System"),
      p(
        "Aligned page density and component emphasis to support Customer Support workflows first.",
      ),
    ],
    outcome: [
      p(
        "The redesign transformed the day-to-day experience for both internal teams and operator clients. The Phase 1 shift from the legacy dark sidebar to the Belloa-aligned light interface was immediately visible to everyone using the platform. Operators provided positive feedback on the modernised feel. Internal staff noted faster navigation and better confidence in the interface.",
      ),
      p(
        "The research process in Phase 2 — the first structured UX research cycle the back office had ever received — produced a body of documented insights that shaped not only Phase 3 priorities but the broader product roadmap conversation with the PM team.",
      ),
      p(
        "Phase 3's role-based approach marks the beginning of a longer product strategy: giving different operator and internal user types an interface built around how they actually work, not just what the system can do.",
      ),
      h("Key takeaways"),
      p(
        "The back office redesign reinforced something I've found consistently in B2B product work: legacy platforms don't need a full rebuild to feel fundamentally different. Structural navigation, consistent feedback patterns, and a coherent visual language can transform how a product is perceived — and trusted — without touching the underlying architecture.",
      ),
      p(
        "Running the research myself, from interview guide to affinity clustering, made the design rationale defensible across every stakeholder conversation. When Phase 3 priorities were questioned, I could point to documented user behaviour, not intuition.",
      ),
    ],
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug);
}

export function studyNeighbours(slug: string): {
  previous?: CaseStudy;
  next?: CaseStudy;
} {
  const index = caseStudies.findIndex((study) => study.slug === slug);
  return {
    previous: index > 0 ? caseStudies[index - 1] : undefined,
    next:
      index >= 0 && index < caseStudies.length - 1
        ? caseStudies[index + 1]
        : undefined,
  };
}
