# Cabinet POC: PRD (draft v4)

Status: draft v4, simplified after Eduardo's review. Living doc, update it as slices teach us things.
Assumes PR #35 (themes as data) is merged to main.

## Why this exists

The portfolio is a 3D slot machine with switchable art directions. The 2D side is proven: tokens in `js/themes.js` re-skin the page. The 3D side is the risk. Today the cabinet is one hard-coded object that reads its colours once at start-up, so it cannot change shape per theme and does not update on a live theme switch (the scene only reads tokens at load, nothing in the machine code subscribes to `themechange`).

Common thread of the whole portfolio: interfaces can be playful, and iGaming is not fintech. The themes exist to show that range, built from one design system.

## Goal

Prove that one cabinet, driven by theme data, can look convincingly different across the range, from flat and boxy (Swiss) to arched and lit (Vegas) to angular and armoured (Command) to glassy (Aero), switch live, and hold up on a real phone.

## The four themes that ship

Swiss is the shipping default.

| Theme | Cabinet | The hard bit |
|---|---|---|
| Swiss (default) | Flat matte off-white enamel box, black reel window, red knob, printed labels, flat red circle behind | Almost nothing. The easy win, proves the flat end |
| Vegas | Arched top, instanced bulb ring, neon trim, marquee base, pink knob | Arch geometry and glow |
| Command | Chamfered armour plating in purple, lime edge strips and hazard-orange decals, hinged guard over the red lever | Angular geometry, decals, and the hinged guard, which is a real shape change |
| Aero | Rounded translucent body, silver face, glass bubble behind, green glass knob | Transmission glass on mobile |

**Instrument** is not a shipping theme. It is what is built today, so slice 1 uses it as the parity baseline (the cabinet must look identical before and after the refactor). Slice 2 removes it from the switcher when Swiss becomes the default. It stays in git history.

Dropped: Instrument (after slice 1), Spotlight, Mission Control, ASCII, Pixel Handheld, Clay.

## Reference images

Mood only, not specs. The generated micro text is garbled and gets ignored.

```
docs/cabinet-poc/refs/
  <theme>-front.webp
  <theme>-side.webp
  <theme>-34.webp      three-quarter view, doubles as the mood image
```

For `swiss`, `vegas`, `command` and `aero`. Command is the Eva-inspired render: purple, lime and hazard-orange armour, no logos, no characters. Each file at most about 200 KB as webp. No full-size images in git. No Instrument, Spotlight or Mission Control refs: Instrument's baseline is screenshots of the current build, attached to the slice 1 PR, not committed. The front, side and three-quarter views are for modelling (proportions, the arch profile, chamfers).

## In scope

- The cabinet, the headline "Ideas into Play" and a theme switcher, on a separate page, `poc.html`, next to `index.html`. The circle behind the machine arrives with Swiss in slice 2. `poc.html` shares `js/machine/stage.js` with the main page, so the live-switching fix lands in both.
- The headline is flat (no tilt) in every theme for now. [TODO] Placeholder copy. Eduardo owns the final copy. No em dashes, British English, unslop pass before commit.
- Pulling the lever works in every theme (reels and lever are shared across themes).
- Dev panel: FPS, draw calls, geometry and texture counts, and a "switch x50" button. Those numbers are the leak test.

## Out of scope

Case study transitions, the work list, the /system page, real copy, production, the tilted headline (`display-tilt` is deferred), ASCII, Pixel, Clay, Spotlight, Mission Control, test automation, any change to eduardodesouza.me.

## Cabinet anatomy

Every cabinet is a fixed core plus themeable slots. The core is constants in code, not theme fields. A theme only fills slots, with parts from a small library (arch, bulb ring, chamfered plate, guard, grille and so on). The builder knows slots and parts, never theme names.

| Fixed core (every theme) | Themeable slots (the theme fills them) |
|---|---|
| Reel window: position and size | Body silhouette outside the window: sides, depth, chamfers or corner radius |
| Three reels: radius, symbols, spin logic | Top: flat, arch, crown |
| Lever on the right, same pivot and travel | Lever knob and any guard |
| Four indicator slots that code can drive (`setLed`), one per case | How each indicator looks: lamps, bulbs, strips, or printed numbered cells (Swiss) |
| Payline and glass over the reels | Base: feet, marquee |
| Label zones: where titles and numbers go | Finish, trim, decals, lights |
| An envelope: max height, width and depth, so the arch, crown and bubble fit the default camera frame and the phone crop | Extras: speaker grille, side panels |

The core only guarantees that there are four indicators, in a known order, and that each can be switched on and off. It never dictates their look.

The envelope starts as today's cabinet bounds, extracted as constants in slice 1. A later slice that needs more room asks first.

## How it is built

1. **Cabinet as data.** Each theme gets a `cabinet` block in `themes.js` that fills the slots in the anatomy above: body silhouette, top (`flat` or `arch`), finish, trim, decals, lights, base, indicator style, lever accessory (including the guard for Command). The fixed core stays in code. `buildCabinet(renderer, spec, colors, count)` returns the group plus a `dispose()`. Concept: a build is a pure function of a spec. The builder never branches on a theme name. Everything that differs comes from the spec.
2. **Reel window is a constant.** `reelWindow` belongs to the stage, not to a theme. The body spec is expressed around it. Extra height (the Vegas arch, a Command crown, a marquee) grows above or around the window, so it stays in the same place and size in every theme. It is the zoom target for the case study transition later.
3. **Live switching.** The stage subscribes to `themechange`. It waits until idle (reels not spinning, no camera move, home view), loads the new theme's assets, disposes the old cabinet's geometry, materials and textures, reads colours again, resets the clear colour, builds the new cabinet and carries over the reels and lever state. A short canvas fade hides the swap. Reduced motion swaps instantly. Concept: subscribe, do not copy.
4. **Lazy assets.** Each theme loads only its own fonts, bitmaps and any theme-specific builder module (via dynamic `import()`), only when it is selected. `ensureThemeAssets(theme)` resolves before the rebuild. The default theme loads with the page. Procedural canvas textures cost no download but count towards the GPU texture total in the leak test.
5. **Backdrop and headline stay in the DOM,** driven by tokens. New token in slice 2: `machine-ornament` (the circle or ring behind the machine; today's `ornament` only attaches to the hero copy).
6. **Glow.** Emissive materials and additive glow sprites first. Full bloom only if it holds the frame rate on a phone.
7. **Fonts.** Each theme needs its own display font, self-hosted as latin woff2 with the OFL text. Reel textures are drawn on a canvas, so wait for fonts to load before drawing. [TODO] Pick the fonts per theme once the cabinets exist.
8. **Aero glass.** Fake glass first (environment map plus a Fresnel edge, no real transmission). Real transmission only if it holds the frame rate on Eduardo's phone. If neither works, Aero stays as today's blue recolour.

## Slices

One branch and one PR per slice. Eduardo merges. Each slice gets a Vercel preview. Slice files are written just in time, after the previous slice has taught us something.

1. **Cabinet spec and live switching.** Spec, pure builder with `dispose()`, live switching, the dev panel, all on `poc.html`. Instrument at parity, Vegas and Aero colours switching live. This is the bug fix. One session. Spec: `slice-1.md`. Model: Opus.
2. **Swiss.** Becomes the default. The `tokens.css` fallback and the drift check move to Swiss. Instrument leaves the switcher. Adds the `machine-ornament` token and the circle. Model: Sonnet.
3. **Vegas.** Arch, instanced bulb ring, neon trim, marquee base. Model: Sonnet, moving to Opus if the arch hits trouble.

Then the go/no-go (below).

4. **Command**, only after go. Model: Sonnet.
5. **Aero** glass and bubble, only after go. Model: Sonnet.
6. **Review**: what passed, what did not, what ships. Model: Sonnet.

## Go/no-go after slice 3

Slices 1 to 3 decide whether the spec flexes. It flexes if all of these hold:

- Every pass criterion below is met for Swiss and Vegas.
- Vegas's arch, bulb ring and trim are built from spec fields and shared builders. A theme-name conditional in the builder (`if (theme === 'vegas')`) is a fail.
- 50 switches are leak-free, and the frame rate holds on Eduardo's phone.

Eduardo makes the call, with the preview in this chat.

- **Go:** Command, then Aero.
- **No-go:** ship Swiss and Vegas, keep Aero as today's recolour, and stop adding cabinets.

Cut before extending.

## Pass criteria

- No refresh needed when switching themes.
- After "switch x50" in the dev panel, geometry and texture counts are back to the baseline.
- Steady frame rate on Eduardo's own phone (dev panel FPS, by hand).
- Each theme is distinct at a glance.
- Any theme that needs its own model, not parameters, gets cut.
- The reel window sits in the same place and size in every theme.
- All four indicator slots respond to `setLed` in every theme, and the lever works.
- Every theme's cabinet sits inside the envelope and the default camera frame at 1440 and 390. Checked by eye and noted in the PR.
- The headline is readable in every theme, including where it overlaps the circle. Checked by eye and noted in the PR.
- Each theme loads its own assets only when it is selected (check in the network tab).
- Desktop and mobile widths, keyboard navigation and reduced motion all checked, and the checks reported honestly.

## Risks

- The Vegas arch or Command armour may outgrow a single spec. That is what the go/no-go is for.
- A texture rebuild may cause a visible hitch.
- Contrast where the headline overlaps the circle and the glow.
- Font loading order against canvas drawing.
- Aero glass cost on mobile.

## Decisions made

- Four themes ship. Swiss is the default. Instrument is the slice 1 parity baseline only and exits in slice 2.
- Cabinet is a fixed core plus themeable slots. Indicator style is fully themeable (Swiss can use its printed numbered cells).
- Separate `poc.html`.
- Headline flat for now. `display-tilt` deferred.
- Self-hosted OFL fonts.
- No test automation. The dev panel numbers and by-hand checks are the gates.
- Test device: Eduardo's own phone.
- Models: Opus for slice 1. Sonnet for the rest, except Vegas (slice 3), which moves to Opus if it hits trouble.
- Slice 2 (Swiss) waits. Vegas went first (slice 3, Opus), because the POC is about rebuilding the cabinet in different styles.
- Per-theme envelope (slice 3): each theme's `cabinet.envelope` says how much room it needs, and the camera frames each theme to its own envelope. The default is today's, so Instrument does not move.

## Still open

- [TODO] Per-theme display fonts.
- [TODO] Headline copy.
- The repo is public, so these docs are visible to anyone. Fine for design notes. Never put real case study content or client details in them.

## Process

This Project chat is for decisions and critique. Code sessions build. Each slice session starts from this PRD plus its slice file. Before every PR: lint, typecheck and build pass. Never push to main, never force-push, never delete branches or tags. Production and the live domain only on Eduardo's explicit yes.
