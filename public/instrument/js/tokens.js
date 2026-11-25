/*
 * Concept: design tokens.
 * Every curve and duration in the site has a name and lives here, once.
 * JS animations read these directly; CSS gets them as custom properties
 * (--ease-push, --dur-reveal...) via applyMotionTokens(), so the 3D
 * machine and the DOM always move to the same rhythm.
 * Colour and type tokens live in css/tokens.css; the 3D materials read
 * those back with getComputedStyle, so the same goes the other way.
 */

// Cubic-bezier control points, same format as CSS.
export const ease = {
  standard: [0.2, 0, 0, 1],      // default UI movement
  push:     [0.72, 0, 0.16, 1],  // camera dolly in: hesitates, commits, lands soft
  pull:     [0.3, 0, 0.12, 1],   // camera pull back: leaves fast, eases into place
  flip:     [0.6, 0, 0.18, 1],   // shared numeral: slow start so the canvas can fade first
  settle:   [0.16, 1, 0.3, 1],   // content arriving
  exit:     [0.5, 0, 0.75, 0],   // content leaving, accelerating away
};

// Milliseconds.
export const dur = {
  leverHold: 90,       // pause at the bottom of a pull
  spinMin: 900,        // all reels spin at least this long
  reelGap: 300,        // stagger between reel stops
  reelStop: 640,       // base deceleration time for reel 1
  settle: 420,         // the little bounce after each reel stops
  holdOnWin: 620,      // beat on the match before the camera moves
  heroOut: 220,
  dolly: 1300,
  pullBack: 1050,
  canvasFade: 260,
  flip: 820,
  stagger: 70,
  reveal: 680,
  pageOut: 280,
  shortEntrance: 560,
  calm: 420,           // reduced-motion crossfade
  sweepEvery: 7400,    // idle: light across the glass
  sweep: 1800,
  nudgeEvery: 9000,    // idle: reels shuffle one stop
  hintEvery: 6000,     // idle: the lever twitches until first used
};

/* A cubic-bezier solver, so JS can use exactly the curves CSS uses. */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {            // Newton first, it is fast
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-5) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1; t = x;               // bisection if Newton stalls
    for (let i = 0; i < 24; i++) { if (sx(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; }
    return sy(t);
  };
}

export const easeFn = Object.fromEntries(Object.entries(ease).map(([k, v]) => [k, bezier(...v)]));
export const cssEase = (name) => `cubic-bezier(${ease[name].join(', ')})`;

export function applyMotionTokens(root = document.documentElement) {
  for (const k in ease) root.style.setProperty(`--ease-${k}`, cssEase(k));
  for (const k in dur) root.style.setProperty(`--dur-${k}`, `${dur[k]}ms`);
}
