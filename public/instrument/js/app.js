/*
 * Concept: choreography as cancellable async functions.
 * Each user journey (spin, open, pull again, back) is one async function
 * that reads top to bottom like a storyboard. Each one starts with
 * begin(), which aborts whatever was running. Every await checks the
 * signal, and every journey ends by setting a complete, known view, so an
 * interrupted journey never leaves the page half-way between two.
 */
import { applyMotionTokens, dur, cssEase } from './tokens.js';
import { createMachine } from './state.js';
import { createRouter, caseHref, homeHref } from './router.js';
import { studies, bySlug } from './content.js';
import { renderCase, enterCase, leaveCase } from './views/case.js';
import { renderIndex } from './views/home.js';
import { animate, wait } from './motion.js';
import { initTheme } from './themes.js';
import { mountThemeSwitch } from './views/theme-switch.js';

applyMotionTokens();
initTheme();          // before the machine boots: it reads the colours once (slice 2 makes it listen)
mountThemeSwitch(document.querySelector('#theme-switch'));

const $ = (s) => document.querySelector(s);
const body = document.body;
const els = {
  stage: $('#stage'), slot: $('#machine-slot'), hero: $('.hero'),
  home: $('#home'), caseView: $('#case'), main: $('main'),
  spin: $('#spin'), spinLabel: $('#spin .spin-label'), back: $('#back'),
  announcer: $('#announcer'), heroBits: [...document.querySelectorAll('[data-hero]')],
};
renderIndex($('#work-list'));

// ------------------------------------------------------------ environment
const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
// ?2d forces the 2D machine, ?3d skips the low-power guess (not reduced motion).
const lowPower = params.has('2d') || (!params.has('3d') && (
  (navigator.deviceMemory && navigator.deviceMemory <= 2)
  || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)
  || navigator.connection?.saveData === true));

function webglAvailable() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

function fontsReady() {
  const load = Promise.all([
    document.fonts.load('400 100px "Instrument Serif"'),
    document.fonts.load('500 20px "IBM Plex Mono"'),
  ]);
  return Promise.race([load, new Promise((r) => setTimeout(r, 2500))]);
}

// ---------------------------------------------------------- state + view
const fsm = createMachine('transitioning');
fsm.subscribe((state) => { body.dataset.state = state; syncSpinButton(); syncStage(); });

let current = -1;                    // case on screen, or the last one landed
const nextIndex = () => (current + 1) % studies.length;  // deterministic: every pull lands the next study

let run = null;
function begin() { run?.abort(); run = new AbortController(); return run.signal; }

/* Views: home | theatre (machine full screen, on top) | reveal (machine on
   top of the case page, about to fade) | case. */
function setView(name) {
  body.dataset.view = name;
  els.home.hidden = name === 'case' || name === 'reveal';
  els.caseView.hidden = !(name === 'case' || name === 'reveal');
  els.stage.getAnimations().forEach((a) => a.cancel());
  syncStage();
}

let heroVisible = true;
new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; syncStage(); }).observe(els.hero);

function syncStage() {
  if (!machine || machine.fallback) return;
  const v = body.dataset.view;
  machine.setActive(v === 'theatre' || v === 'reveal' || (v === 'home' && (heroVisible || !fsm.is('idle'))));
}

function syncSpinButton() {
  const s = fsm.state;
  const busy = s !== 'idle';
  els.spin.setAttribute('aria-disabled', String(busy));
  els.spinLabel.textContent = s === 'idle' ? 'Pull the lever' : s === 'landed' || s === 'transitioning' ? 'Opening' : 'Spinning';
}

function announce(text) {
  els.announcer.textContent = '';
  requestAnimationFrame(() => { els.announcer.textContent = text; });
}

function heroOut(signal) {
  return Promise.all(els.heroBits.map((el) => animate(el, [{ opacity: 1 }, { opacity: 0 }],
    { duration: dur.heroOut, easing: cssEase('exit'), fill: 'forwards' }, signal)));
}
function heroHide() { els.heroBits.forEach((el) => { el.getAnimations().forEach((a) => a.cancel()); el.style.opacity = '0'; }); }
function heroShow() { els.heroBits.forEach((el) => { el.getAnimations().forEach((a) => a.cancel()); el.style.opacity = ''; }); }
function heroIn(signal) {
  heroShow();
  return Promise.all(els.heroBits.map((el, i) => animate(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
    { duration: dur.reveal, delay: i * dur.stagger, easing: cssEase('settle'), fill: 'backwards' }, signal)));
}

/* Reduced motion and the 2D fallback swap views with a crossfade. The View
   Transitions API does the snapshotting for free where it exists. */
async function calmSwap(update) {
  if (document.startViewTransition) {
    const vt = document.startViewTransition(update);
    try { await vt.finished; } catch { /* skipped by a newer transition */ }
    return;
  }
  await animate(els.main, [{ opacity: 1 }, { opacity: 0 }], { duration: dur.calm / 2, easing: 'ease-out' });
  update();
  await animate(els.main, [{ opacity: 0 }, { opacity: 1 }], { duration: dur.calm / 2, easing: 'ease-in' });
}

function focusCaseTitle() { $('#cs-title')?.focus({ preventScroll: true }); }

// ---------------------------------------------------------------- machine
let machine = null;
const machineReady = (async () => {
  if (!reduced && !lowPower && webglAvailable()) {
    try {
      await fontsReady();
      const { createStage } = await import('./machine/stage.js');
      machine = await createStage({
        mount: els.stage, slot: els.slot, studies,
        onLeverPull: ({ manual }) => spin({ manual }),
      });
      body.dataset.engine = 'webgl';
      syncStage();
      return machine;
    } catch (err) {
      console.warn('3D machine unavailable, using the 2D one.', err);
    }
  }
  await fontsReady();
  const { createFallback } = await import('./machine/fallback.js');
  machine = createFallback({ slot: els.slot, studies, reduced });
  els.slot.addEventListener('click', (e) => { if (e.target.closest('.fb')) spin(); });
  body.dataset.engine = '2d';
  return machine;
})();

// --------------------------------------------------------------- journeys

/* Home: pull, spin, land, push into the reel. */
async function spin({ manual = false } = {}) {
  if (!fsm.is('idle') || body.dataset.view !== 'home') return;
  const signal = begin();
  fsm.send('PULL');
  const m = await machineReady;
  if (signal.aborted) return;
  await spinAndOpen(m, nextIndex(), { manual, signal });
}

async function spinAndOpen(m, target, { manual = false, signal }) {
  const ok = await m.pullAndSpin(target, {
    signal, manual,
    onSpin: () => fsm.send('SPIN'),
    onSettle: () => fsm.send('SETTLE'),
  });
  if (!ok || signal.aborted) return;
  fsm.send('SETTLE');
  fsm.send('LAND');
  current = target;
  const s = studies[target];
  announce(`Landed on ${s.n}, ${s.title}. Opening the case study.`);
  if (!(await wait(dur.holdOnWin, signal))) return;
  await openFromMachine(target, signal);
}

async function openFromMachine(i, signal) {
  fsm.send('NAVIGATE');
  router.push(caseHref(studies[i].slug));
  const m = machine;
  if (m.fallback) {
    const rect = m.heroRect();
    return showCase(i, { fromRect: rect, mode: rect ? 'machine' : 'calm', signal });
  }
  setView('theatre');
  heroOut(signal);
  if (!(await m.pushIn(signal))) return;
  return showCase(i, { fromRect: m.heroRect(), mode: 'machine', signal, overStage: true });
}

/* Put case i on screen. overStage: the machine is still on top and fades
   away to reveal the page, while the numeral flies to its hero spot. */
async function showCase(i, { fromRect = null, mode, signal, overStage = false }) {
  current = i;
  els.caseView.innerHTML = renderCase(i);
  if (mode === 'calm') {
    await calmSwap(() => { setView('case'); scrollTo(0, 0); });
  } else if (overStage) {
    setView('reveal');
    scrollTo(0, 0);
    const entering = enterCase(els.caseView, { fromRect, mode, signal });
    await animate(els.stage, [{ opacity: 1 }, { opacity: 0 }],
      { duration: dur.canvasFade, easing: cssEase('standard'), fill: 'forwards' }, signal);
    if (signal.aborted) return;
    setView('case');
    await entering;
  } else {
    setView('case');
    scrollTo(0, 0);
    await enterCase(els.caseView, { fromRect, mode, signal });
  }
  if (signal.aborted) return;
  fsm.send('ARRIVE_CASE');
  focusCaseTitle();
}

/* Case page back into the machine: the numeral flies to the reel, the
   machine fades up over it, and the page underneath is swapped for home. */
async function collapseToMachine(signal, { centred }) {
  const m = machine;
  m.jump({ blend: 1, centred: centred ? 1 : 0, study: current });
  m.setActive(true);
  await leaveCase(els.caseView, { toRect: m.heroRect(), signal });
  if (signal.aborted) return false;
  heroHide();
  setView('reveal');
  await animate(els.stage, [{ opacity: 0 }, { opacity: 1 }],
    { duration: dur.canvasFade, easing: cssEase('standard'), fill: 'forwards' }, signal);
  if (signal.aborted) return false;
  setView('theatre');
  scrollTo(0, 0);
  els.caseView.innerHTML = '';
  return true;
}

async function goHome({ fromHistory = false, anchor = null, focusSpin = true } = {}) {
  const signal = begin();
  fsm.send('NAVIGATE');
  if (!fromHistory) router.push(homeHref);
  const m = await machineReady;
  if (signal.aborted) return;
  const view = body.dataset.view;

  if (m.fallback || anchor || view === 'home') {
    await calmSwap(() => {
      setView('home');
      heroShow();
      els.caseView.innerHTML = '';
      if (anchor) document.getElementById(anchor)?.scrollIntoView();
      else scrollTo(0, 0);
    });
  } else {
    if (view === 'case') { if (!(await collapseToMachine(signal, { centred: false }))) return; }
    else setView('theatre');          // interrupted mid-move: carry on from here
    if (!(await m.pullOut(signal, { centred: false }))) return;
    setView('home');
    heroIn(signal);
  }
  if (signal.aborted) return;
  fsm.send('ARRIVE_HOME');
  if (focusSpin && !anchor) els.spin.focus({ preventScroll: true });
  announce('Back at the machine.');
}

/* Case to case: back out through the machine and land the next one. */
async function pullAgain() {
  if (!fsm.is('caseStudy')) return;
  const signal = begin();
  fsm.send('NAVIGATE');
  const m = machine;
  const target = nextIndex();
  if (m.fallback) {
    await calmSwap(() => { setView('home'); heroShow(); els.caseView.innerHTML = ''; scrollTo(0, 0); });
  } else {
    if (!(await collapseToMachine(signal, { centred: true }))) return;
    if (!(await m.pullOut(signal, { centred: true }))) return;
  }
  if (signal.aborted) return;
  fsm.send('PULL');
  announce('Pulling again.');
  await spinAndOpen(m, target, { signal });
}

/* Links, history and direct loads: no camera move, a short entrance. */
async function openCaseShort(i, { direct = false } = {}) {
  const signal = begin();
  fsm.send('NAVIGATE');
  const fromCase = body.dataset.view === 'case';
  if (!direct && !fromCase && !reduced) {
    await animate(els.home, [{ opacity: 1 }, { opacity: 0 }], { duration: dur.pageOut, easing: cssEase('exit') }, signal);
    if (signal.aborted) return;
  }
  await showCase(i, { mode: reduced || fromCase ? 'calm' : 'short', signal });
  machineReady.then((m) => { if (current === i) m.jump({ blend: 1, centred: 0, study: i }); });
}

// ----------------------------------------------------------------- wiring
const router = createRouter((route) => {
  if (route.name === 'case') {
    const i = bySlug(route.slug);
    if (i < 0) return goHome({ fromHistory: true });
    if (body.dataset.view === 'case' && current === i) return;
    openCaseShort(i);
  } else if (body.dataset.view !== 'home' || !fsm.is('idle') || route.anchor) {
    if (body.dataset.view === 'home' && route.anchor && fsm.is('idle')) return; // plain in-page anchor
    goHome({ fromHistory: true, anchor: route.anchor, focusSpin: false });
  }
});

els.spin.addEventListener('click', () => spin());
els.back.addEventListener('click', () => goHome());
els.caseView.addEventListener('click', (e) => {
  if (e.target.closest('[data-action="pull-again"]')) pullAgain();
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && body.dataset.view !== 'home') goHome();
});
document.querySelectorAll('a[href="#work"]').forEach((a) => a.addEventListener('click', (e) => {
  if (body.dataset.view !== 'home') return;      // from a case page the router handles it
  e.preventDefault();
  $('#work').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  $('#work-title').focus({ preventScroll: true });
}));
addEventListener('pagehide', (e) => { if (!e.persisted) machine?.destroy(); });

// ------------------------------------------------------------------- boot
const first = router.current();
const firstIndex = first.name === 'case' ? bySlug(first.slug) : -1;
if (firstIndex >= 0) {
  setView('case');
  openCaseShort(firstIndex, { direct: true });
} else {
  setView('home');
  fsm.send('ARRIVE_HOME');
}

// Exposed for testing and for curious readers in the console.
window.__portfolio = { fsm, get machine() { return machine; }, goHome, pullAgain, spin };
