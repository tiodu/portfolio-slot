/*
 * Each theme loads its own assets, and only when it is selected.
 * ensureThemeAssets(theme) resolves when what the theme needs to draw is
 * ready: for now its fonts (the page's display, body and label faces, the
 * cabinet's decal face and the reels' faces). Later slices add bitmaps and
 * a theme's own builder module here, behind the same promise.
 * The stage waits for it before it redraws any canvas texture, because a
 * canvas draws with whatever font is loaded at that moment.
 */
import { resolveSpec } from './cabinet.js';
import { REEL_FONTS } from './textures.js';

const TIMEOUT = 2500;       // never hold the machine hostage to a slow font
const pending = new Map();  // theme name -> promise

function fontsFor(theme) {
  const t = theme.tokens, decals = resolveSpec(theme.cabinet).decals;
  return [
    `${t['display-weight'] ?? 400} 1em ${t['font-display']}`,
    `400 1em ${t['font-body']}`,
    `500 1em ${t['font-label']}`,
    `${decals.weight} 1em ${decals.font}`,
    ...REEL_FONTS,
  ];
}

export function ensureThemeAssets(theme) {
  if (!pending.has(theme.name)) {
    const fonts = Promise.all(fontsFor(theme).map((f) => document.fonts.load(f).catch(() => [])));
    pending.set(theme.name, Promise.race([fonts, new Promise((r) => setTimeout(r, TIMEOUT))]));
  }
  return pending.get(theme.name);
}
