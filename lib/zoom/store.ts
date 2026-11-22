import { ZOOM_MS, progressAt } from "./timeline";

/**
 * Where the zoom progress t lives. It is module state, not React state, so it
 * survives the route change that unmounts the canvas, and the camera and the
 * page layer can read it every frame without re-rendering anything.
 */

type Zoom = {
  t: number;
  /** 1 playing forwards, -1 playing in reverse, 0 not playing. */
  dir: 1 | -1 | 0;
};

let zoom: Zoom = { t: 0, dir: 0 };
let raf = 0;
const listeners = new Set<() => void>();

function emit(next: Zoom) {
  zoom = next;
  listeners.forEach((listener) => listener());
}

function stop() {
  cancelAnimationFrame(raf);
  raf = 0;
}

export function readZoom(): Readonly<Zoom> {
  return zoom;
}

export function subscribeZoom(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Play from `from` to the end in `dir`. Playing forwards ends at t = 1, in reverse at t = 0. */
export function playZoom(dir: 1 | -1, from = dir === 1 ? 0 : 1) {
  stop();
  const startedAt = performance.now();
  // Elapsed time that corresponds to `from`, so a partial run keeps the same pace.
  const offset = (dir === 1 ? from : 1 - from) * ZOOM_MS;
  emit({ t: from, dir });
  const step = (now: number) => {
    const t = progressAt(now - startedAt + offset, dir);
    const done = dir === 1 ? t >= 1 : t <= 0;
    if (done) {
      raf = 0;
      emit({ t: dir === 1 ? 1 : 0, dir: 0 });
      return;
    }
    emit({ t, dir });
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

/** Jump to the end of whatever is playing: t = 1 forwards, t = 0 in reverse. */
export function skipZoom() {
  if (zoom.dir === 0) return;
  stop();
  emit({ t: zoom.dir === 1 ? 1 : 0, dir: 0 });
}

/** Hold at a fixed t without playing, for example while waiting for a route to mount. */
export function holdZoom(t: number) {
  stop();
  emit({ t, dir: 0 });
}

/** Back to rest: no camera offset, no veil. */
export function resetZoom() {
  holdZoom(0);
}
