/**
 * The zoom transition as a pure function of progress.
 *
 * `zoomFrame(t)` maps t (0 to 1) to what the camera, the dim and the page
 * should look like. It holds no state and touches no DOM, so forwards,
 * reverse and skip are all just different values of t:
 * - play forwards: t runs 0 to 1
 * - reverse: t runs 1 to 0 (`progressAt(elapsed, -1)`)
 * - skip: t = 1
 */

/** One place to change the length of the whole transition. */
export const ZOOM_MS = 900;
export const ZOOM_ROLL_DEG = 16;
/** The dolly goes slightly past the reel window so the window fills the frame. */
export const ZOOM_OVERSHOOT = 1.08;

/** Each channel runs in its own window, in milliseconds from the start. */
const CAMERA = [80, 620] as const;
const DIM = [420, 700] as const;
const PAGE = [680, 900] as const;

/** t at which the page route should mount, and where a reverse starts. */
export const PAGE_START_T = PAGE[0] / ZOOM_MS;

export type ZoomFrame = {
  /** 0 at rest. 1 is the reel window filling the frame, so it goes past 1. */
  dolly: number;
  rollDeg: number;
  /** 0 clear, 1 fully dark. */
  dim: number;
  /** 0 hidden, 1 fully shown. */
  page: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(u: number) {
  return 1 - (1 - u) ** 3;
}

function easeInOutQuad(u: number) {
  return u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
}

function windowed(ms: number, [from, to]: readonly [number, number]) {
  return clamp01((ms - from) / (to - from));
}

export function zoomFrame(t: number): ZoomFrame {
  const ms = clamp01(t) * ZOOM_MS;
  const camera = easeOutCubic(windowed(ms, CAMERA));
  return {
    dolly: camera * ZOOM_OVERSHOOT,
    rollDeg: camera * ZOOM_ROLL_DEG,
    dim: easeInOutQuad(windowed(ms, DIM)),
    page: easeInOutQuad(windowed(ms, PAGE)),
  };
}

/** Progress t for a clock that has run `elapsedMs`, playing forwards (1) or in reverse (-1). */
export function progressAt(elapsedMs: number, dir: 1 | -1) {
  const p = clamp01(elapsedMs / ZOOM_MS);
  return dir === 1 ? p : 1 - p;
}
