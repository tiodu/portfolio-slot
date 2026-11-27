/*
 * Concept: procedural textures.
 * Every image on the machine is drawn on a <canvas>: the reel faces, the
 * printed labels, the brushed metal, the shadow. No image downloads, and
 * the reel numerals are set in the same font as the page, which is what
 * lets a reel face turn into the case study hero. They are drawn when a
 * cabinet is built, so a theme switch draws them again in the new colours.
 */
import * as THREE from 'three';

export function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const get = (n) => cs.getPropertyValue(n).trim();
  return {
    paper: get('--paper'), ink: get('--ink'), accent: get('--accent'),
    graphite: get('--graphite'), alu: get('--alu'),
    'accent-2': get('--accent-2'), 'accent-3': get('--accent-3'),
  };
}

// The reels are core: the same faces in every theme.
const DISPLAY = '"Instrument Serif", "Times New Roman", serif';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';
export const REEL_FONTS = [`400 1em ${DISPLAY}`, `500 1em ${MONO}`];

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c, renderer, { srgb = true, repeat = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* Numeral box, as a fraction of the cell. The DOM hero numeral uses
   line-height: 1 and the same font, so "advance width x font-size" is the
   same box in both worlds. That shared box is the shared element. */
export const NUMERAL = { size: 0.56, centreY: 0.45 };

export function drawCell(study, w, h, colors) {
  const [c, x] = canvas(w, h);
  x.fillStyle = colors.paper;
  x.fillRect(0, 0, w, h);

  // Faint paper tooth so the face does not read as flat plastic.
  const img = x.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 5;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  x.putImageData(img, 0, 0);

  // Cell rules top and bottom, and registration marks: printed, not drawn.
  x.fillStyle = colors.ink;
  x.globalAlpha = 0.18;
  const rule = Math.max(1, Math.round(h * 0.003));
  x.fillRect(0, 0, w, rule);
  x.fillRect(0, h - rule, w, rule);
  x.globalAlpha = 0.32;
  const m = w * 0.05, k = w * 0.018;
  for (const [px, py] of [[m, h * 0.1], [w - m, h * 0.1], [m, h * 0.9], [w - m, h * 0.9]]) {
    x.fillRect(px - k, py - rule / 2, k * 2, rule);
    x.fillRect(px - rule / 2, py - k, rule, k * 2);
  }
  x.globalAlpha = 1;

  // The numeral, placed by its line box exactly like the DOM will.
  const size = h * NUMERAL.size;
  x.font = `400 ${size}px ${DISPLAY}`;
  x.textAlign = 'center';
  x.textBaseline = 'alphabetic';
  const mt = x.measureText(study.n);
  const asc = mt.fontBoundingBoxAscent ?? size * 0.8;
  const desc = mt.fontBoundingBoxDescent ?? size * 0.2;
  const boxTop = h * NUMERAL.centreY - size / 2;
  const baseline = boxTop + (size - (asc + desc)) / 2 + asc;
  x.fillStyle = colors.ink;
  x.fillText(study.n, w / 2, baseline);
  const box = { x: (w / 2 - mt.width / 2) / w, y: boxTop / h, w: mt.width / w, h: size / h };

  // Mono label.
  x.font = `500 ${Math.round(h * 0.062)}px ${MONO}`;
  if ('letterSpacing' in x) x.letterSpacing = `${Math.round(h * 0.012)}px`;
  x.fillText(study.reelLabel, w / 2, h * 0.86);
  return { canvas: c, box };
}

export function cellTextures(studies, renderer, colors, cellAspect) {
  // Big enough to survive the close-up at the end of the dolly.
  const wide = Math.min(window.innerWidth, 1600) * Math.min(devicePixelRatio, 2);
  const w = wide > 1400 ? 1536 : 1024;
  const h = Math.round(w / cellAspect);
  const cells = studies.map((s) => drawCell(s, w, h, colors));
  return {
    textures: cells.map((c) => toTexture(c.canvas, renderer)),
    canvases: cells.map((c) => c.canvas),
    boxes: cells.map((c) => c.box),  // per study: "01" is narrower than "03"
  };
}

/* Motion blur, faked: the whole reel strip drawn many times with a
   vertical offset. Shown on top of the sharp reel in proportion to speed. */
export function blurStrip(canvases, renderer, cellsAround) {
  const cw = 256, ch = Math.round(cw * canvases[0].height / canvases[0].width);
  const [strip, s] = canvas(cw, ch * cellsAround);
  for (let i = 0; i < cellsAround; i++) s.drawImage(canvases[i % canvases.length], 0, i * ch, cw, ch);
  const [out, o] = canvas(cw, ch * cellsAround);
  const taps = 18, spread = ch * 0.9;
  for (let i = 0; i < taps; i++) {
    const dy = (i / (taps - 1) - 0.5) * spread;
    o.globalAlpha = 1 / (i + 1);              // running average
    o.drawImage(strip, 0, dy);
    o.drawImage(strip, 0, dy - strip.height); // wrap around
    o.drawImage(strip, 0, dy + strip.height);
  }
  return toTexture(out, renderer);
}

/* Brushed aluminium: thousands of faint horizontal strokes. Used as the
   roughness map, so the brushing shows in the highlights, not as a print. */
export function brushed(renderer) {
  const [c, x] = canvas(512, 512);
  x.fillStyle = '#7a7a7a';
  x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const v = 90 + Math.random() * 80;
    x.strokeStyle = `rgba(${v},${v},${v},${0.08 + Math.random() * 0.2})`;
    x.lineWidth = Math.random() < 0.9 ? 1 : 2;
    const y = Math.random() * 512, l = 60 + Math.random() * 400, s = Math.random() * 512;
    x.beginPath(); x.moveTo(s - l / 2, y); x.lineTo(s + l / 2, y); x.stroke();
    x.beginPath(); x.moveTo(s - l / 2 - 512, y); x.lineTo(s + l / 2 - 512, y); x.stroke();
  }
  return toTexture(c, renderer, { srgb: false, repeat: true });
}

/* Printed graphics on the front plate, drawn with transparency. */
export function decal(w, h, draw, renderer) {
  const [c, x] = canvas(w, h);
  draw(x, w, h);
  return toTexture(c, renderer);
}

export function radial(renderer, inner = 0.55) {
  const [c, x] = canvas(256, 256);
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, `rgba(0,0,0,${inner})`);
  g.addColorStop(0.45, `rgba(0,0,0,${inner * 0.45})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return toTexture(c, renderer, { srgb: false });
}

export function verticalFade(renderer) {
  const [c, x] = canvas(4, 128);
  const g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.78)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 4, 128);
  return toTexture(c, renderer, { srgb: false });
}

/* A soft diagonal band of light for the glass sweep. */
export function sweepBand(renderer) {
  const [c, x] = canvas(512, 128);
  x.translate(256, 64);
  x.transform(1, 0, -0.6, 1, 0, 0);       // skew it so it reads as a reflection
  const g = x.createLinearGradient(-60, 0, 60, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(-300, -64, 600, 128);
  const t = toTexture(c, renderer);
  t.wrapS = THREE.ClampToEdgeWrapping;
  return t;
}
