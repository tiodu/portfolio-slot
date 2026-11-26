/*
 * Cabinet POC page: the shared stage, the theme switcher, a headline and,
 * on localhost or ?dev, the dev panel. No case study journeys here.
 */
import { applyMotionTokens } from './tokens.js';
import { initTheme } from './themes.js';
import { mountThemeSwitch } from './views/theme-switch.js';
import { studies } from './content.js';

applyMotionTokens();
initTheme();
mountThemeSwitch(document.querySelector('#theme-switch'));

const $ = (s) => document.querySelector(s);
const spinButton = $('#spin');
const announcer = $('#announcer');
let stage = null;
let busy = false;
let next = 0;            // every pull lands the next study

function announce(text) {
  announcer.textContent = '';
  requestAnimationFrame(() => { announcer.textContent = text; });
}

async function spin({ manual = false } = {}) {
  if (!stage || busy) return;
  busy = true;
  spinButton.setAttribute('aria-disabled', 'true');
  const target = next;
  const ok = await stage.pullAndSpin(target, { manual });
  next = (next + 1) % studies.length;
  if (ok) announce(`Landed on ${studies[target].n}, ${studies[target].title}.`);
  busy = false;
  spinButton.setAttribute('aria-disabled', 'false');
}
spinButton.addEventListener('click', () => spin());

try {
  if (!document.createElement('canvas').getContext('webgl2')) throw new Error('No WebGL2');
  const { createStage } = await import('./machine/stage.js');
  stage = await createStage({
    mount: $('#stage'), slot: $('#machine-slot'), studies,
    onLeverPull: ({ manual }) => spin({ manual }),
  });
  document.body.dataset.engine = 'webgl';
  stage.setActive(true);
} catch (err) {
  console.warn(err);
  $('#machine-slot').innerHTML = '<p class="note mono">The cabinet needs WebGL2.</p>';
  spinButton.hidden = true;
}

if (stage && (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || new URLSearchParams(location.search).has('dev'))) {
  const { mountDevPanel } = await import('./views/dev-panel.js');
  mountDevPanel($('#dev'), stage);
}
