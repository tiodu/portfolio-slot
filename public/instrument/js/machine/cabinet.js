/*
 * Concept: a build is a pure function of a spec.
 * The cabinet is a fixed core (CORE: the reel window, the reels, the lever,
 * four indicator slots, the payline and glass, the label zones and an
 * envelope) plus themeable slots. A theme fills the slots with data in
 * js/themes.js (`cabinet: { body, top, finish, ... }`) and buildCabinet()
 * turns that data into meshes, picking parts from small registries. Same
 * spec in, same cabinet out, and dispose() frees everything it made, so a
 * live theme switch can throw one cabinet away and build the next.
 *
 * The builder never names a theme. Everything that differs between themes
 * comes from the slots.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { brushed, decal, radial, verticalFade, sweepBand } from './textures.js';
import { disposeAll } from './dispose.js';

/* The cabinet as it was first built: the numbers the core was taken from.
   Frozen here, so the reel window never moves when a theme's body does. */
const FIRST = { W: 3.0, H: 3.4, D: 1.6, FEET: 0.07 };

export const CORE = (() => {
  const { W, H, D, FEET } = FIRST;
  const bevel = 0.02, plateDepth = 0.24;
  const faceZ = D / 2;                          // every body's front face sits here
  const plateBack = faceZ - 0.02;
  const plateFront = plateBack + plateDepth + bevel * 2;
  const R = 0.86, reelW = 0.8, gap = 0.1;
  const winW = reelW * 3 + gap * 2 + 0.12, winH = 1.1;
  const winY = FEET + H * 0.62;
  const reelFront = plateFront - 0.05;
  return {
    faceZ, plateBack, plateFront, plateDepth, bevel,
    // Reel window: the same place and size in every theme (later, the zoom target).
    R, reelW, gap, winW, winH, winY, reelFront, reelZ: reelFront - R,
    cells: 8, cellArc: (2 * Math.PI * R) / 8,
    reelXs: [-(reelW + gap), 0, reelW + gap],
    // Lever on the right: same pivot and travel in every theme.
    lever: { x: W / 2 + 0.22, y: FEET + H * 0.42, length: 1.55, mountX: W / 2 + 0.06 },
    // Four indicator slots, one per case. setLed() drives them; the theme picks their look.
    indicators: { xs: [-0.54, -0.18, 0.18, 0.54], y: winY - winH / 2 - 0.3, z: plateFront + 0.012 },
    // Where the printed titles and numbers go.
    labels: {
      z: plateFront + 0.0015,
      name: { y: winY + winH / 2 + 0.3 },
      indicators: { y: winY - winH / 2 - 0.34 },
      print: { x: -winW / 2 + 0.75, y: FEET + 0.62, w: 1.5, h: 0.75 },
    },
    // Room every themeable part must fit in (the lever and its mount sit
    // outside it, they are core). Today's bounds. A slice that needs more asks first.
    envelope: { min: [-W / 2, 0, -D / 2], max: [W / 2, FEET + H, 1.1] },
    // Overall framing box for the camera, lever included.
    frame: { cx: 0.16, cy: 1.75, w: 3.7, h: 3.75 },
  };
})();

/* Every slot, with its default. Only what the first cabinet does is built;
   the rest are reserved names that later slices add parts for. */
export const DEFAULT_CABINET = {
  body: { width: FIRST.W, height: FIRST.H, depth: FIRST.D, radius: 0.14, fasciaInset: 0.06, fasciaRadius: 0.1 },
  top: { shape: 'flat', rise: 0 },               // later: 'arch', 'crown'
  finish: {
    body: { preset: 'lacquer', color: 'graphite' },
    fascia: { preset: 'brushed', color: 'alu' },
  },
  trim: { style: 'none' },                       // later: neon edges, edge strips
  decals: { font: '"IBM Plex Mono", monospace', weight: 500, grille: 'dots' },
  lights: { style: 'none' },                     // later: bulb ring, glow sprites
  base: { style: 'feet', height: FIRST.FEET },   // later: 'marquee'
  indicators: { style: 'led' },                  // later: bulbs, strips, printed cells
  lever: { knob: 'ball', guard: 'none' },        // later: a hinged guard
};

export function resolveSpec(spec = {}) {
  return Object.fromEntries(Object.entries(DEFAULT_CABINET).map(([slot, d]) => [slot, { ...d, ...spec[slot] }]));
}

export function part(registry, name, slot) {
  const make = registry[name];
  if (!make) throw new Error(`No "${name}" part for the cabinet's ${slot} slot yet.`);
  return make;
}

function roundedRect(shape, x, y, w, h, r) {
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

// ------------------------------------------------------------------ parts

const FINISHES = {
  lacquer: (color) => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.42, metalness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.32,
  }),
  brushed: (color, renderer) => {
    const brush = brushed(renderer);
    brush.repeat.set(0.6, 0.6);
    return new THREE.MeshPhysicalMaterial({
      color, metalness: 1, roughness: 0.34, roughnessMap: brush, anisotropy: 0.7, anisotropyRotation: 0,
    });
  },
};

const NONE = () => {};
const TOPS = { flat: NONE };
const TRIMS = { none: NONE };
const LIGHTS = { none: NONE };

const BASES = {
  // Four rubber feet under the body's corners.
  feet({ group, spec }) {
    const { width, depth } = spec.body, h = spec.base.height;
    const rubber = new THREE.MeshStandardMaterial({ color: '#0d0d0e', roughness: 0.9 });
    const geo = new THREE.CylinderGeometry(0.1, 0.11, h, 24);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const f = new THREE.Mesh(geo, rubber);
      f.position.set(x * (width / 2 - 0.3), h / 2, CORE.faceZ - depth / 2 + z * (depth / 2 - 0.25));
      group.add(f);
    }
  },
};

const INDICATORS = {
  // A small lamp per slot, lit in the accent colour.
  led({ group, colors }) {
    const { xs, y, z } = CORE.indicators;
    const off = new THREE.MeshStandardMaterial({ color: '#3a3836', roughness: 0.4 });
    const on = new THREE.MeshStandardMaterial({ color: colors.accent, emissive: colors.accent, emissiveIntensity: 1.6, roughness: 0.3, toneMapped: false });
    const geo = new THREE.CylinderGeometry(0.034, 0.034, 0.03, 20).rotateX(Math.PI / 2);
    const lamps = xs.map((x) => {
      const m = new THREE.Mesh(geo, off);
      m.position.set(x, y, z);
      group.add(m);
      return m;
    });
    return {
      set(index) { lamps.forEach((m, i) => { m.material = i === index ? on : off; }); },
      materials: [on, off],      // only one of the two is on a mesh at a time
    };
  },
};

const GRILLES = {
  dots(x, w) {
    const cols = 26, rows = 9, gx = w / cols;
    x.globalAlpha = 0.82;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      x.beginPath(); x.arc(gx * (c + 0.5), 40 + r * 36, 7, 0, Math.PI * 2); x.fill();
    }
  },
  none: NONE,
};

/* Printed graphics in the label zones: the nameplate, the indicator
   numbers and the small print, in the decal font. */
function printDecals({ group, spec, colors, count, renderer }) {
  const { labels: L, winW, indicators } = CORE;
  const { font, weight } = spec.decals;
  const face = (px) => `${weight} ${px}px ${font}`;
  const printMat = (tex) => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });

  const nameplate = decal(2048, 220, (x, w, h) => {
    x.fillStyle = colors.ink;
    x.font = face(64);
    if ('letterSpacing' in x) x.letterSpacing = '10px';
    x.textBaseline = 'middle';
    x.fillText('EDUARDO DE SOUZA', 0, h * 0.42);
    x.textAlign = 'right';
    x.globalAlpha = 0.62;
    x.fillText(`WORK SELECTOR / ${count} STUDIES`, w, h * 0.42);
    x.globalAlpha = 1;
    x.fillRect(0, h - 6, w, 4);
  }, renderer);
  const name = new THREE.Mesh(new THREE.PlaneGeometry(winW, winW * 220 / 2048), printMat(nameplate));
  name.position.set(0, L.name.y, L.z);

  const numbers = decal(2048, 200, (x, w, h) => {
    x.fillStyle = colors.ink;
    x.font = face(52);
    x.textBaseline = 'middle';
    x.textAlign = 'center';
    indicators.xs.forEach((lx, i) => x.fillText(`0${i + 1}`, (lx / winW + 0.5) * w, h * 0.78));
    x.textAlign = 'left';
    x.globalAlpha = 0.62;
    x.fillText('CASE', 0, h * 0.3);
    x.textAlign = 'right';
    x.fillText('PULL LEVER', w, h * 0.3);
    x.globalAlpha = 1;
  }, renderer);
  const numbersMesh = new THREE.Mesh(new THREE.PlaneGeometry(winW, winW * 200 / 2048), printMat(numbers));
  numbersMesh.position.set(0, L.indicators.y, L.z);

  // Lower panel: the grille, then the small print that matters.
  const print = decal(1024, 512, (x, w, h) => {
    x.fillStyle = colors.ink;
    part(GRILLES, spec.decals.grille, 'decals.grille')(x, w, h);
    x.globalAlpha = 0.7;
    x.font = face(34);
    if ('letterSpacing' in x) x.letterSpacing = '5px';
    x.textBaseline = 'middle';
    x.fillText('A UI METAPHOR. NOT A CASINO.', 0, h - 92);
    x.fillText('NO REAL MONEY. NO ODDS.', 0, h - 40);
  }, renderer);
  const printMesh = new THREE.Mesh(new THREE.PlaneGeometry(L.print.w, L.print.h), printMat(print));
  printMesh.position.set(L.print.x, L.print.y, L.z);

  group.add(name, numbersMesh, printMesh);
}

// ----------------------------------------------------------------- build

export function buildCabinet(renderer, cabinetSpec, colors, count) {
  const spec = resolveSpec(cabinetSpec);
  const c = CORE, b = spec.body;
  const group = new THREE.Group();
  const ctx = { group, spec, colors, count, renderer };

  // Finishes: one for the body, one for the fascia, so it reads as one designed object.
  const material = (role) => {
    const f = spec.finish[role];
    return part(FINISHES, f.preset, `finish.${role}`)(colors[f.color], renderer);
  };
  const bodyMat = material('body');
  const fasciaMat = material('fascia');

  // Body: sits on the base, front face on the core's face plane.
  const bodyY = spec.base.height + b.height / 2;
  const bodyZ = c.faceZ - b.depth / 2;
  const body = new THREE.Mesh(new RoundedBoxGeometry(b.width, b.height, b.depth, 6, b.radius), bodyMat);
  body.position.set(0, bodyY, bodyZ);
  group.add(body);

  // Fascia with the reel window cut out (an extruded shape with a hole, so
  // the window has real depth). Front face in the fascia finish, edges in the body's.
  const inset = b.fasciaInset + c.bevel;
  const outer = roundedRect(new THREE.Shape(), -b.width / 2 + inset, -b.height / 2 + inset, b.width - inset * 2, b.height - inset * 2, b.fasciaRadius);
  outer.holes.push(roundedRect(new THREE.Path(), -c.winW / 2 - c.bevel, c.winY - bodyY - c.winH / 2 - c.bevel,
    c.winW + c.bevel * 2, c.winH + c.bevel * 2, 0.05));
  const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, {
    depth: c.plateDepth, bevelEnabled: true, bevelThickness: c.bevel, bevelSize: c.bevel, bevelSegments: 4, curveSegments: 10,
  }), [fasciaMat, bodyMat]);
  plate.position.set(0, bodyY, c.plateBack + c.bevel);
  group.add(plate);

  // Themeable slots.
  part(TOPS, spec.top.shape, 'top')(ctx);
  part(TRIMS, spec.trim.style, 'trim')(ctx);
  part(LIGHTS, spec.lights.style, 'lights')(ctx);
  part(BASES, spec.base.style, 'base')(ctx);
  printDecals(ctx);
  const indicators = part(INDICATORS, spec.indicators.style, 'indicators')(ctx);

  // Check the themeable parts against the envelope before the core joins them.
  const box = new THREE.Box3().setFromObject(group);
  const env = c.envelope, eps = 1e-3;
  const fits = box.min.x >= env.min[0] - eps && box.min.y >= env.min[1] - eps && box.min.z >= env.min[2] - eps
    && box.max.x <= env.max[0] + eps && box.max.y <= env.max[1] + eps && box.max.z <= env.max[2] + eps;
  if (!fits) console.warn('Cabinet is outside the envelope.', box, env);

  // --------------------------------------------------------- fixed core
  // Window interior: dark falloff top and bottom sells the curvature.
  const shadeMat = new THREE.MeshBasicMaterial({ color: '#000', alphaMap: verticalFade(renderer), transparent: true, depthWrite: false });
  const shadeH = c.winH * 0.36;
  const shadeTop = new THREE.Mesh(new THREE.PlaneGeometry(c.winW, shadeH), shadeMat);
  shadeTop.position.set(0, c.winY + c.winH / 2 - shadeH / 2, c.reelFront + 0.015);
  const shadeBottom = shadeTop.clone();
  shadeBottom.rotation.z = Math.PI;
  shadeBottom.position.y = c.winY - c.winH / 2 + shadeH / 2;
  group.add(shadeTop, shadeBottom);

  // Payline: the one accent stroke on the machine.
  const accentFlat = new THREE.MeshBasicMaterial({ color: colors.accent, transparent: true, toneMapped: false });
  const payline = new THREE.Mesh(new THREE.PlaneGeometry(c.winW - 0.02, 0.012), accentFlat);
  payline.position.set(0, c.winY, c.reelFront + 0.02);
  group.add(payline);
  const tri = new THREE.Shape();
  tri.moveTo(0, 0.05); tri.lineTo(0.07, 0); tri.lineTo(0, -0.05); tri.closePath();
  const triGeo = new THREE.ShapeGeometry(tri);
  const marks = [-1, 1].map((side) => {
    const m = new THREE.Mesh(triGeo, accentFlat);
    m.position.set(side * (c.winW / 2 + 0.1), c.winY, c.labels.z);
    if (side > 0) m.rotation.z = Math.PI;
    group.add(m);
    return m;
  });

  // Glass, and a band of light that travels across it when idle.
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(c.winW + 0.04, c.winH + 0.04),
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.12, depthWrite: false, envMapIntensity: 2 })
  );
  glass.position.set(0, c.winY, c.plateFront - 0.03);
  group.add(glass);
  const sweep = new THREE.Mesh(
    new THREE.PlaneGeometry(c.winW, c.winH),
    new THREE.MeshBasicMaterial({ map: sweepBand(renderer), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  sweep.position.set(0, c.winY, c.plateFront - 0.028);
  group.add(sweep);

  // Contact shadow, sized to the body's footprint.
  const shadow = (w, d, inner, y) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ color: '#000', alphaMap: radial(renderer, inner), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, y, bodyZ);
    return m;
  };
  group.add(shadow(b.width * 2.1, b.depth * 2.6, 0.4, 0.002), shadow(b.width * 1.15, b.depth * 1.3, 0.85, 0.003));

  // Lever mount on the right side, at the core's lever pivot.
  const mount = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.7, 0.7, 4, 0.05), bodyMat);
  mount.position.set(c.lever.mountX, c.lever.y, 0);
  group.add(mount);

  // Everything above is this build's own. The reels and lever join later
  // and dispose of themselves.
  const own = [...group.children];
  let led = -1;

  return {
    group,
    materials: { body: bodyMat, fascia: fasciaMat },
    glass, sweep, payline, marks, shades: [shadeTop, shadeBottom],
    fits,
    get led() { return led; },
    setLed(index) { led = index; indicators.set(index); },
    dispose() { disposeAll(own, indicators.materials); },
  };
}
