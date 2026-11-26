/*
 * Concept: themes are data.
 * A theme is one plain object. applyTheme() writes each of its tokens to
 * :root as a CSS custom property (--paper, --radius, --glow...) and then
 * dispatches "themechange", so anything else that needs the look (the 3D
 * machine in slice 2, a /system page in slice 3) listens instead of
 * keeping its own copy. site.css only ever reads tokens; it never names
 * a theme.
 *
 * css/tokens.css keeps a copy of the "instrument" tokens for the first
 * paint and for no JavaScript. On localhost a drift check warns if that
 * copy and this file disagree.
 *
 * Rules for values:
 * - paper, ink, accent, graphite and alu stay plain hex: the 3D machine
 *   reads them back with getComputedStyle and hands them to Three.js and
 *   canvas, which do not understand var() or color-mix().
 * - Neon (accent, accent-2) only on large type, rules and ornaments.
 *   Small text uses ink, ink-2 or accent-ink.
 * - Decoration lives in ornament, divider and label-mark, never in markup.
 */

const STORE = 'instrument-theme';
export const defaultTheme = 'instrument';

/* A Googie starburst as an SVG data URI: alternating long and short
   spikes. With alternate off, every spike is long: a four-point sparkle. */
function starburst(fill, spikes = 12, { inner = 13, alternate = true } = {}) {
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 ? inner : !alternate || i % 4 === 0 ? 50 : 34;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-50 -50 100 100'><polygon points='${pts.join(' ')}' fill='${fill}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/* A glossy Aero bubble at a given background position and size: a white
   hotspot over a clear body with a bright rim. Both layers are centred
   in their own tile, so nothing is cut off at the tile edge. */
const bubble = (at) => [
  `radial-gradient(circle at 36% 32%, rgba(255, 255, 255, 0.95) 0 6%, rgba(255, 255, 255, 0) 20%) ${at} no-repeat`,
  `radial-gradient(circle closest-side, rgba(190, 232, 255, 0.4), rgba(90, 175, 235, 0.14) 78%, rgba(255, 255, 255, 0.8) 93%, rgba(255, 255, 255, 0) 100%) ${at} no-repeat`,
].join(', ');

export const themes = {
  instrument: {
    name: 'instrument',
    label: 'Instrument',
    scheme: 'light',
    themeColor: '#f1eee8',
    tokens: {
      // Colour: paper, ink, one signal accent. Graphite and aluminium are the machine.
      'paper': '#f1eee8',
      'paper-2': '#e6e2da',
      'ink': '#141414',
      'ink-2': '#55524c',
      'rule': 'rgba(20, 20, 20, 0.16)',
      'accent': '#e5470e',
      'accent-ink': '#b3350a',
      'accent-2': '#e5470e',
      'accent-3': '#e5470e',
      'graphite': '#1d1e20',
      'alu': '#deded9',
      // Surfaces
      'surface-fill': 'var(--paper)',
      'panel': 'color-mix(in srgb, var(--paper) 88%, transparent)',
      'panel-filter': 'blur(8px)',
      'border': '1px solid var(--rule)',
      'radius': '0px',
      'radius-sm': '3px',
      'shadow': 'none',
      'bar-fill': 'transparent',
      'bar-filter': 'none',
      'bar-edge': 'none',
      'hero-fill': 'transparent',
      'hero-border': 'none',
      'hero-filter': 'none',
      'hero-pad': '0px',
      // Controls
      'button-fill': 'var(--ink)',
      'button-ink': 'var(--paper)',
      'button-hover': '#000',
      'knob': 'radial-gradient(circle at 35% 30%, #ff8a5c 0 18%, var(--accent) 45%, #a8300a 100%)',
      // Effects and ornament
      'display-ink': 'var(--ink)',
      'glow': 'none',
      'glow-2': 'none',
      'ornament': 'none',
      'divider': 'none',
      'label-mark': 'none',
      // Type
      'font-display': '"Instrument Serif", "Times New Roman", serif',
      'font-body': '"IBM Plex Mono", ui-monospace, Menlo, monospace',
      'font-label': '"IBM Plex Mono", ui-monospace, Menlo, monospace',
      'font-lead': 'var(--font-display)',
      'display-weight': '400',
      'display-scale': '1',
      'display-leading': '1',
      'display-tracking': '0em',
      'quote-style': 'italic',
      'label-tracking': '0.04em',
      'label-case': 'uppercase',
    },
  },

  vegas: {
    name: 'vegas',
    label: 'Vegas',
    scheme: 'dark',
    themeColor: '#120a24',
    tokens: {
      'paper': '#120a24',
      'paper-2': '#1e1238',
      'ink': '#f6effc',
      'ink-2': '#c4b8d8',
      'rule': 'rgba(246, 239, 252, 0.18)',
      'accent': '#ff2e93',        // hot pink neon: focus, payline, glow
      'accent-ink': '#ffb8da',    // pale pink, readable as small text
      'accent-2': '#29e3ff',      // cyan neon
      'accent-3': '#ffcf5a',      // warm bulb yellow
      'graphite': '#1c1033',
      'alu': '#5b4d80',           // dark violet chrome, so light print stays legible
      'surface-fill': [
        'radial-gradient(1.5px 1.5px at 12% 18%, rgba(255, 255, 255, 0.7), transparent) 0 0 / 260px 260px',
        'radial-gradient(1px 1px at 68% 42%, rgba(255, 255, 255, 0.5), transparent) 0 0 / 260px 260px',
        'radial-gradient(1.5px 1.5px at 38% 78%, rgba(255, 207, 90, 0.6), transparent) 0 0 / 260px 260px',
        'linear-gradient(180deg, #1c0f38 0%, #120a24 45%, #0e081c 100%)',
      ].join(', '),
      'panel': 'rgba(18, 10, 36, 0.86)',
      'panel-filter': 'blur(10px)',
      'border': '1px solid rgba(255, 46, 147, 0.5)',
      'radius': '14px',
      'radius-sm': '4px',
      'shadow': '0 0 0 1px rgba(41, 227, 255, 0.12), 0 0 28px rgba(255, 46, 147, 0.22)',
      'bar-fill': 'rgba(18, 10, 36, 0.82)',
      'bar-filter': 'blur(10px)',
      'bar-edge': 'inset 0 -1px 0 rgba(255, 46, 147, 0.45)',
      'hero-fill': 'rgba(18, 10, 36, 0.88)',
      'hero-border': 'var(--border)',
      'hero-filter': 'blur(10px)',
      'hero-pad': 'var(--s-3)',
      'button-fill': 'var(--accent)',
      'button-ink': '#16061f',
      'button-hover': '#ff5aa9',
      'knob': 'radial-gradient(circle at 35% 30%, #fff6d6 0 16%, #ffcf5a 45%, #c98a12 100%)',
      // Neon tube: a near-white core with a coloured halo.
      'display-ink': '#ffe4f1',
      'glow': '0 0 0.02em #fff, 0 0 0.08em #ff2e93, 0 0 0.22em rgba(255, 46, 147, 0.75), 0 0 0.5em rgba(255, 46, 147, 0.35)',
      'glow-2': '0 0 0.02em #fff, 0 0 0.08em #29e3ff, 0 0 0.22em rgba(41, 227, 255, 0.7), 0 0 0.5em rgba(41, 227, 255, 0.3)',
      // Positions are inside the ::before box, which reaches 3rem past the panel.
      'ornament': `${starburst('#ffcf5a')} right 0 top 0 / 7.5rem 7.5rem no-repeat, ${starburst('#29e3ff', 4, { inner: 9, alternate: false })} right 8rem top 1.25rem / 2.25rem 2.25rem no-repeat`,
      // Marquee bulbs along the top edge of the sheet.
      'divider': 'radial-gradient(circle, #fff3c4 0 2px, #ffcf5a 3px, rgba(255, 207, 90, 0.3) 5px, transparent 7px) 0 50% / 22px 14px repeat-x',
      'label-mark': '"\\2666\\00a0\\00a0" / ""',
      'font-display': '"Shrikhand", "Cooper Black", Georgia, serif',
      'font-body': '"Jost", "Futura", "Century Gothic", system-ui, sans-serif',
      'font-label': '"Jost", "Futura", "Century Gothic", system-ui, sans-serif',
      'font-lead': 'var(--font-body)',
      'display-weight': '400',
      'display-scale': '0.64',
      'display-leading': '1.18',
      'display-tracking': '0.035em',
      'quote-style': 'normal',
      'label-tracking': '0.07em',
      'label-case': 'uppercase',
    },
  },

  aero: {
    name: 'aero',
    label: 'Aero',
    scheme: 'light',
    themeColor: '#cfe9ff',
    tokens: {
      'paper': '#f2f9ff',
      'paper-2': '#e1f0fa',
      'ink': '#0c2a44',
      'ink-2': '#3b5872',
      'rule': 'rgba(12, 42, 68, 0.16)',
      'accent': '#0a72cc',        // aqua blue: focus, payline
      'accent-ink': '#075a9f',
      'accent-2': '#3ea92b',      // fresh green, decoration only
      'accent-3': '#8fd3ff',
      'graphite': '#1b5a8e',
      'alu': '#e4f1f8',
      'surface-fill': 'linear-gradient(180deg, #cfe9ff 0%, #eaf6ff 35%, #eef9e6 75%, #dcf3cb 100%)',
      'panel': 'rgba(255, 255, 255, 0.55)',
      'panel-filter': 'blur(14px) saturate(1.4)',
      'border': '1px solid rgba(255, 255, 255, 0.9)',
      'radius': '18px',
      'radius-sm': '8px',
      'shadow': '0 10px 30px rgba(16, 90, 160, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
      'bar-fill': 'linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.5))',
      'bar-filter': 'blur(14px) saturate(1.4)',
      'bar-edge': '0 1px 0 rgba(255, 255, 255, 0.9), 0 6px 20px rgba(16, 90, 160, 0.12)',
      'hero-fill': 'linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.55))',
      'hero-border': 'var(--border)',
      'hero-filter': 'blur(14px) saturate(1.4)',
      'hero-pad': 'var(--s-3)',
      // Glossy pill: a bright band on top, a deeper lower half. The band stays
      // in the top 30%, above the label, so white text keeps 5:1.
      'button-fill': 'linear-gradient(180deg, #4aa6ea 0%, #1670c4 30%, #1670c4 49%, #0a5aa8 51%, #0e66b8 100%)',
      'button-ink': '#ffffff',
      'button-hover': 'linear-gradient(180deg, #5cb2f0 0%, #1670c4 30%, #1670c4 49%, #0b62b6 51%, #1270c4 100%)',
      'knob': 'radial-gradient(circle at 35% 30%, #ffffff 0 14%, #8be06a 40%, #2f9a1f 100%)',
      'display-ink': '#0a3d6b',
      'glow': '0 1px 0 rgba(255, 255, 255, 0.85)',
      'glow-2': '0 1px 0 rgba(255, 255, 255, 0.85)',
      'ornament': [bubble('right 0 top 0.25rem / 6.5rem 6.5rem'), bubble('right 7rem top 0.75rem / 2.25rem 2.25rem'), bubble('left 0.25rem bottom 0.25rem / 3.5rem 3.5rem')].join(', '),
      'divider': 'linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0) 2px), linear-gradient(180deg, rgba(143, 211, 255, 0.45), rgba(143, 211, 255, 0))',
      'label-mark': 'none',
      'font-display': '"Open Sans", "Segoe UI", Frutiger, system-ui, sans-serif',
      'font-body': '"Open Sans", "Segoe UI", Frutiger, system-ui, sans-serif',
      'font-label': '"Open Sans", "Segoe UI", Frutiger, system-ui, sans-serif',
      'font-lead': 'var(--font-display)',
      'display-weight': '300',
      'display-scale': '0.8',
      'display-leading': '1.14',
      'display-tracking': '0.01em',
      'quote-style': 'normal',
      'label-tracking': '0.02em',
      'label-case': 'none',
    },
  },
};

const root = document.documentElement;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const currentTheme = () => (themes[root.dataset.theme] ? root.dataset.theme : defaultTheme);

/* The declarations for one theme, as a style string. Also what the inline
   script in index.html paints before first paint on the next visit. */
function declarations(theme) {
  const css = Object.entries(theme.tokens).map(([k, v]) => `--${k}: ${v}`);
  if (theme.scheme === 'dark') css.push('color-scheme: dark');
  return css.join('; ');
}

function write(theme, { force = false } = {}) {
  const previous = root.dataset.theme || null;
  if (previous === theme.name && !force) return;        // already on screen
  for (const [k, v] of Object.entries(theme.tokens)) root.style.setProperty(`--${k}`, v);
  root.style.colorScheme = theme.scheme === 'dark' ? 'dark' : '';
  root.dataset.theme = theme.name;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.themeColor);
  try { localStorage.setItem(STORE, JSON.stringify({ name: theme.name, css: declarations(theme) })); } catch { /* private mode */ }
  document.dispatchEvent(new CustomEvent('themechange', { detail: { name: theme.name, previous, theme } }));
}

/* Switch theme. A crossfade where the View Transitions API exists, and
   never under reduced motion: then the change is instant. */
let requested = null;   // latest wins: a quick run of arrow presses ends on the last one

export function applyTheme(name, { transition = true, force = false } = {}) {
  requested = themes[name] ?? themes[defaultTheme];
  const changing = requested.name !== root.dataset.theme;
  if (transition && changing && !reducedMotion() && document.startViewTransition) {
    // Writes `requested` at call time, so a transition skipped by a newer
    // switch still lands on the newest choice.
    const vt = document.startViewTransition(() => write(requested));
    vt.ready.catch(() => {});
  } else {
    write(requested, { force });
  }
}

/* Start-up: ?theme= wins, then the saved choice, then the default. */
export function initTheme() {
  checkFallback();
  const asked = new URLSearchParams(location.search).get('theme');
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE))?.name; } catch { /* ignore */ }
  const name = [asked, saved].find((n) => n && themes[n]) ?? defaultTheme;
  applyTheme(name, { transition: false, force: true });   // force: the inline script may have painted it already
}

/* Dev only: the CSS fallback must match the instrument theme exactly. */
function checkFallback() {
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  const sheet = [...document.styleSheets].find((s) => s.href?.endsWith('/css/tokens.css'));
  const rule = sheet && [...sheet.cssRules].find((r) => r.selectorText === ':root');
  if (!rule) return;
  const drift = Object.entries(themes[defaultTheme].tokens)
    .filter(([k, v]) => rule.style.getPropertyValue(`--${k}`).trim() !== v)
    .map(([k]) => `--${k}`);
  if (drift.length) console.warn(`css/tokens.css has drifted from js/themes.js: ${drift.join(', ')}`);
}
