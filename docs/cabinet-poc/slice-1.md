# Slice 1: cabinet spec and live theme switching

Branch: `poc/slice-1`. One PR, one session. Model: Opus. Read `PRD.md` first.

## Goal

Turn the cabinet into a function of a spec, make the 3D scene follow theme changes live, and add a dev panel to prove it. All of it runs on `poc.html`. Instrument is the parity baseline and must look exactly as it does today.

## Concepts to teach (brief, in the PR description)

- A build is a pure function of a spec: same spec in, same cabinet out, with a `dispose()` to clean up.
- Subscribe, do not copy: the scene listens for `themechange` instead of reading colours once.

## Context to confirm first

Verify these in the code before changing anything, and say if any is wrong:

- `js/machine/stage.js` calls `readColors()` once, builds the cabinet, reels and lever once, and sets the clear colour once.
- Nothing in `js/machine/` listens for `themechange`. Only `js/views/theme-switch.js` does.
- `js/machine/textures.js` draws the reel faces, labels, brushed metal and decals on canvases at start-up, with fixed font constants.
- `buildCabinet(renderer, colors, count)` in `cabinet.js` has its dimensions and finishes hard-coded.
- PR #35 is merged, so `js/themes.js` is on main.

## Before you change anything

Take Instrument "before" screenshots from main, at a desktop viewport and a phone viewport. Keep the same viewport sizes for the "after" shots.

## Work

1. **`poc.html`**, next to `index.html`. A thin page: the stage (shared `js/machine/stage.js`), the theme switcher, the headline "Ideas into Play" (flat, no tilt, [TODO] placeholder copy) and the dev panel. Reuse `css/tokens.css` and what is cheap from `css/site.css`. Do not refactor `site.css`. No circle yet (slice 2).
2. **Spec in the themes.** Add a `cabinet` block to each of Instrument, Vegas and Aero in `js/themes.js`. Fields: `body` (width, height, depth, radius), `top` (`flat` or `arch`, rise), `finish` (preset), `trim`, `decals`, `lights`, `base`, `lever` (knob style, guard). In this slice all three themes use the same geometry values as today. Only implement what the current cabinet already does. Reserve the rest with documented defaults. Do not build the arch, the guard or any new geometry.
3. **Reel window as a constant.** Pull the reel window's position and size out into a stage constant (`reelWindow`). The body spec is expressed around it. It is not a theme field. Later, the arch and crown grow above it.
4. **Pure builder.** Change `buildCabinet` to take the spec and return `{ group, ..., dispose }`. `dispose()` frees every geometry, material and texture it created. The builder never branches on a theme name. Everything that differs comes from the spec.
5. **Asset hook.** Add `ensureThemeAssets(theme)`, which resolves when the theme's fonts (and later its bitmaps and builder module) are ready. Each theme loads only its own assets, only when selected. For now it awaits the theme's fonts. Reel and label textures are redrawn only after it resolves.
6. **Live rebuild.** On `themechange`, wait until the machine is idle (home view, reels not spinning, no camera move). Then `ensureThemeAssets`, dispose the old cabinet, read colours again, set the clear colour, rebuild the cabinet and textures, and re-attach the reels and lever with their current state (symbols, LED). If a switch arrives while busy, the latest one wins when it goes idle. A short canvas fade hides the swap (reuse the existing `canvasFade` duration). Under reduced motion the swap is instant.
7. **Dev panel** (localhost or `?dev`): FPS, draw calls, triangles, geometry and texture counts from `renderer.info`, and a "switch x50" button that cycles themes 50 times and reports the counts before and after.

## Checks, all by hand

- **Leak test:** press "switch x50" in the dev panel. Report the geometry and texture counts before and after.
- **Instrument parity:** "after" screenshots at the same viewports as the "before" ones, both sets attached to the PR. Say what, if anything, differs.
- **Frame rate:** open the Vercel preview on a phone and read FPS in the dev panel. Eduardo does this one.
- **Headline:** check readability by eye in each theme and note it in the PR.
- **Lazy assets:** in the network tab, an unselected theme's fonts are not requested until it is selected.
- **Also check:** desktop and mobile widths, keyboard navigation (the theme switcher by arrow keys), reduced motion, and that `index.html` still loads and switches.

## Acceptance criteria

- Switching themes on `poc.html` updates the cabinet, lever, reels and background with no refresh, in every direction (Instrument, Vegas, Aero and back).
- Instrument matches today's look.
- After "switch x50", geometry and texture counts are back to the baseline.
- The reel window sits in the same place and size in every theme.
- The page paints the saved theme on first load as it does now (the inline script in `index.html`), with no flash of the wrong cabinet.
- Pulling the lever works after a switch.
- `prefers-reduced-motion` gives an instant swap, no fade.
- Lint, typecheck and build pass.

## Out of scope

New geometry, new themes, the circle and `machine-ornament`, the tilted headline, new fonts, Swiss, case study transitions, test automation. Do not touch the main flow beyond what the rebuild needs. Do not touch the live domain, DNS or production. Screenshots go in the PR, not in git at full size.

## Stop and ask if

- Rebuilding on switch causes a visible hitch you cannot hide with the fade.
- The spec cannot express something the current cabinet does without hacks.
- Disposal leaves counts growing after 50 switches and you cannot find the leak.

## Report back

What you verified at desktop and mobile widths, with keyboard and reduced motion, the before and after counts from "switch x50", the parity screenshots, and the Vercel preview link. Do not say done without a working preview link.
