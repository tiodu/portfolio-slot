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
 *
 * `cabinet` fills the 3D machine's themeable slots (see DEFAULT_CABINET in
 * js/machine/cabinet.js for every slot and what it may hold). Colour
 * names in `finish` are token names. The reel window, reels, lever and
 * indicator slots are the fixed core and never appear here.
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
    cabinet: {
      body: { width: 3.0, height: 3.4, depth: 1.6, radius: 0.14, fasciaInset: 0.06, fasciaRadius: 0.1 },
      top: { shape: 'flat', rise: 0 },
      finish: { body: { preset: 'lacquer', color: 'graphite' }, fascia: { preset: 'brushed', color: 'alu' } },
      trim: { style: 'none' },
      decals: { font: '"IBM Plex Mono", monospace', weight: 500, grille: 'dots' },
      lights: { style: 'none' },
      base: { style: 'feet', height: 0.07 },
      indicators: { style: 'led' },
      lever: { knob: 'ball', guard: 'none' },
    },
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
    // From docs/cabinet-poc/refs/vegas-*: cream enamel, an arched top with a
    // bulb ring and a faceted star, neon outlines, a chrome plinth and tray.
    cabinet: {
      envelope: { min: [-1.68, 0, -0.9], max: [1.68, 4.78, 1.56] },   // taller and deeper than the default
      body: { width: 3.2, height: 3.08, depth: 1.6, radius: 0.1, fasciaInset: 0.12, fasciaRadius: 0.14 },
      top: {
        shape: 'arch', rise: 1.45, depth: 1.6, rim: 0.34, recess: 0.12,
        rimFinish: { preset: 'enamel', color: '#2a1342' },
        panel: { rays: 14, base: '#1a0a2e', glow: '#3d1d55', ray: '#8f6a3a', strength: 0.45 },
        crest: {
          shape: 'star', y: 0.74, height: 1.56, width: 1.0, waist: 0.24, apex: 0.34,
          finish: { preset: 'chrome', color: '#e6b04f' },
          back: { size: 0.56, finish: { preset: 'chrome', color: '#8b45d0' } },
        },
      },
      finish: { body: { preset: 'enamel', color: '#e9dcc4' }, fascia: { preset: 'enamel', color: '#efe5d1' } },
      trim: {
        style: 'neon', radius: 0.016, glow: 0.09,
        tubes: [
          { path: 'window', offset: 0.03, color: 'accent-2' },
          { path: 'window', offset: 0.065, color: 'accent' },
          { path: 'outline', inset: 0.065, color: 'accent' },
          { path: 'arch', inset: 0.52, span: [0.2, 0.8], z: 'recess', color: 'accent' },
          { path: 'arch', inset: 0.85, span: [0, 0.33], z: 'recess', color: 'accent-2' },
          { path: 'arch', inset: 0.85, span: [0.67, 1], z: 'recess', color: 'accent-2' },
          { path: 'sides', offset: 0.16, color: 'accent' },
          { path: 'sides', offset: 0.24, color: 'accent-2' },
        ],
        bezel: { from: 0.085, to: 0.12, height: 0.03, finish: { preset: 'chrome', color: '#d9d6e0' } },
      },
      decals: { font: '"IBM Plex Mono", monospace', weight: 500, grille: 'none', ink: '#3b1d5e', nameplate: false, print: false },
      lights: {
        style: 'bulbs', path: 'arch', inset: 0.17, count: 15, size: 0.055, color: 'accent-3', chase: 0.16,
        floor: { color: 'accent', width: 6, depth: 3.6, opacity: 0.35 },
      },
      base: {
        style: 'plinth', height: 0.12, overhang: 0.06, front: 1.52, finish: { preset: 'chrome', color: '#cfcdd6' },
        tray: { width: 1.5, height: 0.4, inside: '#120a1c' },
      },
      indicators: { style: 'bulbs', size: 0.045, color: 'accent-3' },
      lever: { knob: 'ball', guard: 'none', color: '#d4202c', finish: { preset: 'chrome', color: '#d9d6e0' } },
    },
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

  command: {
    name: 'command',
    label: 'Command',
    scheme: 'dark',
    themeColor: '#0c0a12',
    // From docs/cabinet-poc/refs/command-*: chamfered purple armour, lime
    // edge strips, hazard-stripe plates, a speaker grille, a stepped base
    // and a hinged shoulder guard over a lime lever. No logos, no characters.
    cabinet: {
      envelope: { min: [-1.72, -0.01, -1.1], max: [2.18, 4.02, 1.36] },  // the guard and fin need room
      body: { width: 3.2, height: 3.4, depth: 1.6, radius: 0.22, fasciaInset: 0.08, fasciaRadius: 0.16, corner: 'chamfer' },
      top: { shape: 'flat', rise: 0 },
      finish: { body: { preset: 'satin', color: '#2f1a52' }, fascia: { preset: 'satin', color: '#36205f' } },
      trim: {
        style: 'none',
        bezel: { from: 0.02, to: 0.13, height: 0.05, corner: 'chamfer', finish: { preset: 'satin', color: '#1b1622' } },
        edges: { segments: [[0.15, 1.1], [2.1, 3.25]], finish: { preset: 'satin', color: 'accent-2' } },
        grille: { x: 0, y: 0.86, r: 0.27, color: '#1e1729', ring: { preset: 'satin', color: '#2b1f3d' } },
        plates: [
          // Front, above the window: the caution plate, hazard stripes, a ridge.
          { face: 'front', points: [[-1.44, 2.9], [-0.62, 2.9], [-0.46, 3.06], [-0.62, 3.22], [-1.44, 3.22]], finish: { preset: 'satin', color: '#1b1622' } },
          { face: 'front', points: [[-1.5, 3.3], [-0.35, 3.3], [-0.2, 3.5], [-1.5, 3.5]], depth: 0.03, finish: { preset: 'satin', color: '#ffffff' }, pattern: { colors: ['accent', '#15111a'], period: 0.2 } },
          { face: 'front', points: [[0.7, 2.92], [1.44, 2.92], [1.44, 3.2], [0.88, 3.2]], depth: 0.03, finish: { preset: 'satin', color: '#ffffff' }, pattern: { colors: ['accent', '#15111a'], period: 0.16 } },
          { face: 'front', points: [[-0.38, 3.26], [0.5, 3.26], [0.62, 3.44], [-0.18, 3.44]], depth: 0.03, finish: { preset: 'satin', color: '#5a3592' } },
          // Front, below: lime lines round the grille.
          { face: 'front', points: [[-0.98, 1.12], [-0.9, 1.12], [-0.42, 0.6], [-0.5, 0.6]], depth: 0.02, finish: { preset: 'satin', color: 'accent-2' } },
          { face: 'front', points: [[0.9, 1.12], [0.98, 1.12], [0.5, 0.6], [0.42, 0.6]], depth: 0.02, finish: { preset: 'satin', color: 'accent-2' } },
          { face: 'front', points: [[-0.5, 0.56], [0.5, 0.56], [0.5, 0.6], [-0.5, 0.6]], depth: 0.02, finish: { preset: 'satin', color: 'accent-2' } },
          // Clamps on the base.
          { face: 'front', on: 1.32, points: [[-1.25, 0.03], [-0.7, 0.03], [-0.7, 0.17], [-1.25, 0.17]], depth: 0.03, finish: { preset: 'satin', color: '#141118' } },
          { face: 'front', on: 1.32, points: [[0.7, 0.03], [1.25, 0.03], [1.25, 0.17], [0.7, 0.17]], depth: 0.03, finish: { preset: 'satin', color: '#141118' } },
          // Left side: an orange slash and a fin above the top.
          { face: 'left', points: [[0.45, 0.35], [0.15, 0.35], [-0.35, 1.95], [-0.05, 1.95]], finish: { preset: 'satin', color: 'accent' } },
          { face: 'left', points: [[0.35, 3.1], [-0.35, 3.1], [-0.45, 3.95], [0.2, 3.75]], depth: 0.1, finish: { preset: 'satin', color: '#3a2163' } },
          { face: 'left', out: 0.1, points: [[0.2, 3.75], [0.35, 3.1], [0.42, 3.1], [0.27, 3.78]], depth: 0.02, finish: { preset: 'satin', color: 'accent-2' } },
          // Right side, below the lever: a darker armour plate with a lime edge.
          { face: 'right', points: [[0.55, 0.3], [-0.7, 0.3], [-0.7, 0.95], [-0.2, 1.05], [0.4, 0.95]], depth: 0.05, finish: { preset: 'satin', color: '#36205c' } },
          { face: 'right', out: 0.05, points: [[0.4, 0.95], [0.5, 0.95], [0.6, 0.35], [0.5, 0.35]], depth: 0.02, finish: { preset: 'satin', color: 'accent-2' } },
        ],
      },
      decals: {
        font: '"Barlow Condensed", sans-serif', weight: 600, grille: 'none', ink: '#d9d3e6', nameplate: false, print: false,
        labels: [
          { text: 'CAUTION', x: -1.0, y: 3.06, size: 0.17, lift: 0.045 },
          { text: 'EMERGENCY', x: -1.0, y: 0.5, size: 0.15 },
          { text: 'REEL 01', x: 1.1, y: 0.5, size: 0.15 },
        ],
      },
      lights: { style: 'none', floor: { color: 'accent', width: 6.5, depth: 4, opacity: 0.45 } },
      base: {
        style: 'plinth', height: 0.2, overhang: 0.08, front: 1.32, finish: { preset: 'satin', color: '#2c1a4a' },
        tray: { width: 2.8, height: 0.1, inside: '#140d20' },
      },
      indicators: { style: 'led', color: 'accent-2' },
      lever: {
        knob: 'ball', color: 'accent-2', finish: { preset: 'satin', color: '#1d1a22' },
        guard: 'shoulder', guardFinish: { preset: 'satin', color: '#3a2163' }, guardLift: 0.35, guardDepth: [-0.95, -0.36],
        guardShape: [[-0.05, 0.12], [0.25, 0.28], [0.48, 0.05], [0.52, -0.95], [0.4, -1.25], [0.32, -0.35], [-0.05, -0.28]],
        guardPanels: [
          { points: [[0.36, -0.02], [0.45, 0.02], [0.47, -0.78], [0.38, -0.6]], finish: { preset: 'satin', color: 'accent' } },
          { points: [[0.0, 0.1], [0.24, 0.24], [0.24, 0.18], [0.0, 0.05]], finish: { preset: 'satin', color: 'accent-2' } },
        ],
      },
    },
    tokens: {
      'paper': '#0c0a12',
      'paper-2': '#17121f',
      'ink': '#ecf2d8',           // pale lime-white: the reel numerals glow like the refs
      'ink-2': '#a99fc0',
      'rule': 'rgba(236, 242, 216, 0.16)',
      'accent': '#ff6a1a',        // hazard orange: focus, payline
      'accent-ink': '#ffb37a',
      'accent-2': '#8bdc2f',      // lime edge strips
      'accent-3': '#ffd84a',
      'graphite': '#432570',
      'alu': '#2b2238',
      'surface-fill': 'radial-gradient(120% 60% at 50% 100%, rgba(255, 106, 26, 0.16), transparent 60%), linear-gradient(180deg, #110d18 0%, #0c0a12 60%, #0a0810 100%)',
      'panel': 'rgba(16, 12, 22, 0.88)',
      'panel-filter': 'blur(8px)',
      'border': '1px solid rgba(139, 220, 47, 0.45)',
      'radius': '4px',
      'radius-sm': '2px',
      'shadow': '0 0 0 1px rgba(255, 106, 26, 0.12), 0 12px 30px rgba(0, 0, 0, 0.5)',
      'bar-fill': 'rgba(12, 10, 18, 0.86)',
      'bar-filter': 'blur(8px)',
      'bar-edge': 'inset 0 -1px 0 rgba(139, 220, 47, 0.4)',
      'hero-fill': 'rgba(16, 12, 22, 0.9)',
      'hero-border': 'var(--border)',
      'hero-filter': 'blur(8px)',
      'hero-pad': 'var(--s-3)',
      'button-fill': 'var(--accent)',
      'button-ink': '#140a04',
      'button-hover': '#ff8a45',
      'knob': 'radial-gradient(circle at 35% 30%, #e9ffc9 0 14%, #8bdc2f 45%, #3f7a12 100%)',
      'display-ink': '#ecf2d8',
      'glow': 'none',
      'glow-2': 'none',
      // Hazard tape above the panel.
      'ornament': 'repeating-linear-gradient(-45deg, #ff6a1a 0 10px, #15111a 10px 20px) right 3rem top 2.25rem / 9rem 0.6rem no-repeat',
      'divider': 'repeating-linear-gradient(-45deg, #ff6a1a 0 6px, transparent 6px 12px) 0 50% / 100% 5px no-repeat',
      'label-mark': '"\\25B6\\00a0" / ""',
      'font-display': '"Barlow Condensed", "Arial Narrow", system-ui, sans-serif',
      'font-body': '"Jost", "Futura", system-ui, sans-serif',
      'font-label': '"Barlow Condensed", "Arial Narrow", system-ui, sans-serif',
      'font-lead': 'var(--font-body)',
      'display-weight': '600',
      'display-scale': '0.9',
      'display-leading': '0.95',
      'display-tracking': '0.01em',
      'quote-style': 'normal',
      'label-tracking': '0.08em',
      'label-case': 'uppercase',
    },
  },
  aero: {
    name: 'aero',
    label: 'Aero',
    scheme: 'light',
    themeColor: '#cfe9ff',
    // From docs/cabinet-poc/refs/aero-*: a rounded glass shell (fake glass:
    // a thin tint plus a Fresnel rim), a thick chrome window frame, a chrome
    // band on bun feet with a tray, a green knob, soap bubbles.
    cabinet: {
      envelope: { min: [-1.66, 0, -0.86], max: [1.66, 3.24, 1.34] },
      body: { width: 3.2, height: 2.92, depth: 1.6, radius: 0.42, fasciaInset: 0.12, fasciaRadius: 0.3 },
      top: { shape: 'flat', rise: 0 },
      finish: {
        body: { preset: 'glass', color: '#bfe3fb', opacity: 0.34, rim: { color: '#ffffff', power: 1.4, strength: 1, spec: 0.6 } },
        fascia: { preset: 'glass', color: '#a8dbff', opacity: 0.4, rim: { color: '#ffffff', power: 2.4, strength: 0.7 } },
      },
      trim: {
        style: 'none',
        bezel: { from: 0, to: 0.17, height: 0.09, finish: { preset: 'chrome', color: '#ffffff', env: 3, roughness: 0.24 } },
      },
      decals: { font: '"Open Sans", sans-serif', weight: 600, grille: 'none', nameplate: false, print: false },
      lights: {
        style: 'none',
        bubbles: [[-1.95, 3.25, -0.4, 0.3], [2.35, 3.3, -0.6, 0.15], [2.45, 1.95, 0.1, 0.22], [-2.05, 0.8, 0.3, 0.13], [-1.8, 1.7, -0.6, 0.08]],
      },
      base: {
        style: 'plinth', height: 0.3, slab: 0.17, radius: 0.08, overhang: 0.04, front: 1.32, footRadius: 0.17,
        finish: { preset: 'chrome', color: '#ffffff', env: 3, roughness: 0.24 },
        tray: { width: 2.3, height: 0.12, inside: '#cfe3f0' },
      },
      indicators: { style: 'led', color: 'accent-2' },
      lever: { knob: 'ball', guard: 'none', color: '#6ccf4a', finish: { preset: 'chrome', color: '#ffffff', env: 3, roughness: 0.24 } },
    },
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
