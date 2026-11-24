# The instrument

A portfolio for Eduardo de Souza where the home page is a 3D work selector: pull the lever, the reels land a case study, and the camera pushes into the winning reel until its face becomes the case study page.

A UI metaphor, not a casino. No real money, no odds, every pull lands a case study.

## Run it

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

Opening `index.html` from the file system will not work, because ES modules need http. Three.js 0.170.0 loads from jsDelivr through the import map in `index.html`. The fonts are self-hosted in `fonts/` (both OFL).

Query flags for testing:

- `?2d` forces the 2D machine.
- `?3d` skips the low-power guess (devices with 2 cores or less, 2 GB memory or Save-Data get 2D by default). Reduced motion always gets 2D.

## Art direction

Three directions were on the table:

1. **Lacquered collectible.** Oxblood lacquer and brass, a jewellery-box object. Gorgeous, but it reads as casino.
2. **Brutalist poster machine.** Flat slabs and giant type. Strong, but it throws away the 3D craft that is the point.
3. **Lab instrument.** Graphite body, brushed aluminium fascia, printed labels, one signal-orange accent. Braun and Teenage Engineering, not Las Vegas.

Picked 3: it is the only one that is unmistakably a designed tool and not a gambling machine, which matters most to hiring managers outside iGaming.

Type: Instrument Serif for display, IBM Plex Mono for labels. A warm editorial serif against a cold machined object; the mono reads as the engraving on it. The reel faces are printed on the page's own paper colour, in the page's own font, so a reel face can become the page.

## How it is built (read in this order)

| File | The one concept |
| --- | --- |
| `js/tokens.js`, `css/tokens.css` | Design tokens: every colour, curve and duration has one name |
| `js/state.js` | A finite state machine: idle, pulled, spinning, settling, landed, transitioning, caseStudy |
| `js/motion.js` | One animation loop, and tweens you can cancel with an AbortSignal |
| `js/router.js` | Hash routing: every case study has its own URL |
| `js/app.js` | Choreography as cancellable async functions, so any journey can be interrupted |
| `js/machine/stage.js` | One camera, one number: the whole dolly is driven by `blend` (0 home, 1 inside the reel) |
| `js/machine/reels.js` | Velocity-matched easing: reels slow down from exactly the speed they were spinning at |
| `js/machine/lever.js` | A damped spring, which is where the weight and overshoot come from |
| `js/machine/cabinet.js` | A designed object from a few honest parts |
| `js/machine/textures.js` | Procedural textures, drawn once on a canvas |
| `js/machine/fallback.js` | Same interface, different engine: the 2D machine |
| `js/views/case.js` | One template, four fillings, with the shared-element entrance |

## Still [TODO]

Everything not stated as fact is a visible `[TODO]` on the page: role, year, team, scope for 02 and 03, every section's copy, the pull quotes, image slots, email and links, and how Pick'em relates to the two company awards.
