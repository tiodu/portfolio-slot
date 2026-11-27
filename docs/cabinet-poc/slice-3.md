# Slice 3: Vegas

Branch: `poc/slice-3`. One PR. Model: Opus. Read `PRD.md` first.

Slice 2 (Swiss) is skipped for now, on Eduardo's call: the POC exists to rebuild the cabinet in different styles, and Vegas is the hardest and decides the go/no-go. Instrument stays the default and stays in the switcher until Swiss lands.

## Goal

Build the Vegas cabinet from the refs (`refs/vegas-front.webp`, `-side`, `-34`), as close as three.js parameters allow, using only spec fields and shared parts. After slice 1 every theme was the same box in a different colour. Vegas should be distinct at a glance.

## What the refs show

- A cream lacquer body, soft rounded edges, a chrome plinth and a chrome coin tray in front.
- An arched top the full width of the body, with a ring of warm bulbs, a pink neon outline, a recessed sunburst panel and a faceted gold and purple star.
- Neon around the reel window (cyan inside, pink outside) and down the front edges of the body.
- A chrome bezel around the window. A red ball knob.
- No printed labels. The refs' reels (serif numerals) are core and stay as they are.

## Decisions

- **Per-theme envelope** (Eduardo, this session). The arch and tray do not fit today's envelope. Each theme's spec carries its own `envelope`, and the camera frames each theme to its own envelope. The default envelope and framing are today's, so Instrument does not move. The reel window, reels, lever pivot and indicator slots stay core.
- The arch, bulbs and neon follow paths derived from the body and the reel window (an arch outline, a window outline, the front edges), so another theme can reuse them with different numbers.
- Glow is faked: emissive tubes that skip tone mapping, plus a wider additive halo. No bloom pass.
- Colours in the cabinet spec are token names or plain hex, so Vegas can have a cream body without changing the page tokens.

## Concepts to teach (brief, in the PR description)

- Instancing: the bulb ring is one `InstancedMesh`, one draw call for every bulb.
- Fake glow: a bright unlit core plus an additive halo reads as neon without a post-processing pass.

## Work

1. Envelope and frame from the spec. `frameFor(envelope)` gives today's frame for today's envelope.
2. New parts: `top: arch` (with a sunburst recess and a `crest: star`), `lights: bulbs` (instanced, along the arch), `trim: neon` (tubes along named paths, and a chrome bezel), `base: plinth` (with a tray), `indicators: bulbs`, a `chrome` finish, a `decals.nameplate` switch, and a lever knob colour.
3. The Vegas `cabinet` block in `themes.js`, written from the refs.

## Checks

As slice 1: switch x50 back to baseline, Instrument unchanged, the reel window in the same place, all four indicators respond, the lever works, the cabinet inside its own envelope and the frame at 1440 and 390, keyboard and reduced motion, lint, typecheck and build. Side-by-side screenshots of Vegas against the refs go in the PR, with what still differs, stated honestly.

## Stop and ask if

- Vegas needs a theme-name conditional, or a part that only Vegas could ever use.
- The frame rate drops visibly on the preview.
- Matching the refs needs the reel window or lever pivot to move.
