/*
 * Concept: one animation loop, cancellable tweens.
 * Everything that moves subscribes to a single requestAnimationFrame
 * ticker. The ticker stops itself when nothing is subscribed or the tab
 * is hidden, which is most of "render only when needed".
 * Tweens take an AbortSignal: aborting resolves them with `false` on the
 * next frame, so a transition can be interrupted at any point and the
 * next one starts from wherever the values were left.
 */

const subscribers = new Set();
let rafId = 0;
let last = 0;

function frame(now) {
  rafId = 0;
  const dt = Math.min(0.064, last ? (now - last) / 1000 : 1 / 60); // clamp long frames
  last = now;
  for (const fn of [...subscribers]) fn(dt, now);
  if (subscribers.size && !document.hidden) rafId = requestAnimationFrame(frame);
  else last = 0;
}

function start() {
  if (!rafId && subscribers.size && !document.hidden) rafId = requestAnimationFrame(frame);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(rafId); rafId = 0; last = 0; }
  else start();
});

export function addTick(fn) {
  subscribers.add(fn);
  start();
  return () => subscribers.delete(fn);
}

export function tween(duration, easing, onUpdate, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve(false);
    let elapsed = 0;
    const off = addTick((dt) => {
      if (signal?.aborted) { off(); resolve(false); return; }
      elapsed += dt * 1000;
      const p = duration > 0 ? Math.min(1, elapsed / duration) : 1;
      onUpdate(easing(p), p);
      if (p >= 1) { off(); resolve(true); }
    });
  });
}

export const wait = (ms, signal) => tween(ms, (x) => x, () => {}, signal);

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smoothstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

/* WAAPI helper: resolves when done or aborted, finishing the animation
   on abort so the DOM is left in its end state, never half-way. */
export function animate(el, keyframes, options, signal) {
  if (!el) return Promise.resolve(true);
  const a = el.animate(keyframes, options);
  const onAbort = () => { try { a.finish(); } catch { /* already gone */ } };
  signal?.addEventListener('abort', onAbort, { once: true });
  return a.finished.then(() => true, () => false).finally(() => signal?.removeEventListener('abort', onAbort));
}
