/*
 * Concept: same interface, different engine.
 * The 2D machine exposes the same methods as the WebGL stage
 * (pullAndSpin, pushIn, pullOut, jump, heroRect), so the app's
 * choreography does not care which one it is driving. Used for no WebGL,
 * reduced motion and low-power devices. It still tells the same story:
 * three reels, a lever, a match, a case study.
 */
import { dur } from '../tokens.js';
import { wait } from '../motion.js';

export function createFallback({ slot, studies, reduced }) {
  const el = document.createElement('div');
  el.className = 'fb';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <div class="fb-body">
      <div class="fb-plate">
        <div class="fb-name"><span>Eduardo de Souza</span><span>Work selector / 4 studies</span></div>
        <div class="fb-window">
          ${[0, 1, 2].map(() => '<div class="fb-reel"><span class="fb-num">01</span><span class="fb-label">LABEL</span></div>').join('')}
          <i class="fb-payline"></i>
        </div>
        <div class="fb-leds">${studies.map((s) => `<span><i></i>${s.n}</span>`).join('')}</div>
        <p class="fb-print">A UI metaphor. Not a casino.<br>No real money. No odds.</p>
      </div>
    </div>
    <div class="fb-lever"><i></i></div>`;
  slot.appendChild(el);
  const reels = [...el.querySelectorAll('.fb-reel')];
  const leds = [...el.querySelectorAll('.fb-leds span')];

  function set(reel, i) {
    reel.querySelector('.fb-num').textContent = studies[i].n;
    reel.querySelector('.fb-label').textContent = studies[i].reelLabel;
  }
  [3, 0, 1].forEach((i, r) => set(reels[r], i));

  return {
    fallback: true,
    setActive() {},
    get blend() { return 0; },
    async pullAndSpin(target, { signal, onSpin, onSettle } = {}) {
      leds.forEach((l) => l.classList.remove('on'));
      el.classList.add('pulled');
      onSpin?.();
      if (reduced) {
        await wait(120, signal);
        reels.forEach((r) => set(r, target));
      } else {
        // Tick the numbers through, stopping left to right.
        const stops = reels.map((_, i) => dur.spinMin * 0.6 + i * dur.reelGap);
        let t = 0, n = 0;
        while (t < stops[2]) {
          if (signal?.aborted) break;
          reels.forEach((r, i) => { if (t < stops[i]) set(r, (n + i) % studies.length); else set(r, target); });
          if (t >= stops[0]) onSettle?.();
          n++;
          await wait(70, signal);
          t += 70;
        }
        reels.forEach((r) => set(r, target));
      }
      el.classList.remove('pulled');
      onSettle?.();
      leds[target]?.classList.add('on');
      return !signal?.aborted;
    },
    pushIn: async () => true,
    pullOut: async () => true,
    jump({ study }) {
      if (study === undefined) return;
      reels.forEach((r) => set(r, study));
      leds.forEach((l, i) => l.classList.toggle('on', i === study));
    },
    // In the 2D version the middle numeral is still the shared element,
    // unless the visitor asked for reduced motion.
    heroRect() {
      if (reduced) return null;
      const r = reels[1].querySelector('.fb-num').getBoundingClientRect();
      return r.width ? r : null;
    },
    destroy() { el.remove(); },
  };
}
