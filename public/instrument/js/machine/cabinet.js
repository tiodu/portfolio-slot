/*
 * Concept: a build is a pure function of a spec.
 * The cabinet is a fixed core (CORE: the reel window, the reels, the lever,
 * four indicator slots, the payline and glass, the label zones) plus
 * themeable slots, and an envelope the theme declares and the camera frames. A theme fills the slots with data in
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
  };
})();

/* The camera frames the theme's envelope plus margins, and always the
   lever (core). Today's envelope gives today's frame exactly. The camera
   sits a little above and the machine is turned, so anything reaching
   further forward than the default lands lower on screen: the bottom
   margin grows with it. */
const LEVER_RIGHT = 2.01, DEFAULT_FRONT = 1.1;
export function frameFor(env) {
  const x0 = env.min[0] - 0.19, x1 = Math.max(env.max[0] + 0.19, LEVER_RIGHT);
  const y0 = env.min[1] - 0.125 - Math.max(0, env.max[2] - DEFAULT_FRONT) * 0.7, y1 = env.max[1] + 0.155;
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
}

/* Every slot, with its default: the first cabinet. Colours anywhere in a
   spec are token names ('accent', 'accent-3') or plain hex. */
export const DEFAULT_CABINET = {
  // Room every themeable part must fit in (the lever and its mount are core
  // and sit outside it). The camera frames it. A theme that needs more says so.
  envelope: { min: [-FIRST.W / 2, 0, -FIRST.D / 2], max: [FIRST.W / 2, FIRST.FEET + FIRST.H, 1.1] },
  body: { width: FIRST.W, height: FIRST.H, depth: FIRST.D, radius: 0.14, fasciaInset: 0.06, fasciaRadius: 0.1 },
  // 'flat', or 'arch': rise, depth (front to back), rim (band width),
  // recess (how far the panel sits back), panel (sunburst), crest.
  top: { shape: 'flat', rise: 0 },
  finish: {
    body: { preset: 'lacquer', color: 'graphite' },
    fascia: { preset: 'brushed', color: 'alu' },
  },
  // 'none', or 'neon': tubes along named paths, and an optional bezel.
  trim: { style: 'none' },
  decals: { font: '"IBM Plex Mono", monospace', weight: 500, grille: 'dots', ink: 'ink', nameplate: true, print: true },
  // 'none', or 'bulbs': instanced along a path, with an optional chase.
  // `floor` adds a coloured glow on the floor under the machine.
  lights: { style: 'none' },
  base: { style: 'feet', height: FIRST.FEET },   // or 'plinth', with a tray
  indicators: { style: 'led' },                  // or 'bulbs'
  lever: { knob: 'ball', guard: 'none', color: 'accent' },   // optional `finish` for the hub and mount
};

export function resolveSpec(spec = {}) {
  return Object.fromEntries(Object.entries(DEFAULT_CABINET).map(([slot, d]) => [slot, { ...d, ...spec[slot] }]));
}

export function part(registry, name, slot) {
  const make = registry[name];
  if (!make) throw new Error(`No "${name}" part for the cabinet's ${slot} slot yet.`);
  return make;
}

export const tint = (colors, name) => colors[name] || name;

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
  // Glossy painted metal: no metalness, a hard clear coat.
  enamel: (color) => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12,
  }),
  // Polished metal. Tinted, it is gold or anodised colour.
  chrome: (color) => new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: 0.14 }),
};

const finishOf = ({ colors, renderer }, f, slot) => part(FINISHES, f.preset, slot)(tint(colors, f.color), renderer);

// ------------------------------------------------------------------ paths
/* Named lines across the cabinet, all derived from the body, the top and
   the reel window, so any theme can hang neon or bulbs on them. Each path
   gives one or more polylines and the normal of the surface it lies on. */
const Z = new THREE.Vector3(0, 0, 1), X = new THREE.Vector3(1, 0, 0);
const planeZ = (spec, at) => ({
  plate: CORE.plateFront + 0.008,
  face: CORE.faceZ + 0.008,
  recess: CORE.faceZ - (spec.top.recess ?? 0) + 0.008,
})[at];

function rectPoints(cx, cy, hw, hh, r, z) {
  const pts = [];
  for (const [x, y, a0] of [[hw - r, hh - r, 0], [-hw + r, hh - r, 0.5], [-hw + r, -hh + r, 1], [hw - r, -hh + r, 1.5]]) {
    for (let i = 0; i <= 6; i++) {
      const a = (a0 + i / 12) * Math.PI;
      pts.push(new THREE.Vector3(cx + x + Math.cos(a) * r, cy + y + Math.sin(a) * r, z));
    }
  }
  return pts;
}

// Half an ellipse over the top's base line, from left to right.
function archPoints(spec, inset, [s0, s1] = [0, 1], z, n = 48) {
  const a = spec.body.width / 2 - inset, b = spec.top.rise - inset, y0 = spec.base.height + spec.body.height;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = Math.PI * (1 - (s0 + (s1 - s0) * (i / n)));
    pts.push(new THREE.Vector3(Math.cos(t) * a, y0 + Math.sin(t) * b, z));
  }
  return pts;
}

const PATHS = {
  // Around the reel window, `offset` outside its edge.
  window: (spec, { offset = 0.05, z = 'plate' }) => {
    const c = CORE;
    return [{ points: rectPoints(0, c.winY, c.winW / 2 + offset, c.winH / 2 + offset, 0.05 + offset, planeZ(spec, z)), closed: true, normal: Z }];
  },
  // Along the arched top, `inset` inside its edge. `span` takes part of it.
  arch: (spec, { inset = 0.05, span, z = 'face' }) => [{ points: archPoints(spec, inset, span, planeZ(spec, z)), normal: Z }],
  // Up one front edge of the body, over the top, down the other.
  outline: (spec, { inset = 0.05, z = 'face' }) => {
    const zz = planeZ(spec, z), x = spec.body.width / 2 - inset, y = spec.base.height + 0.02;
    const top = spec.top.rise > 0 ? archPoints(spec, inset, [0, 1], zz) : [];
    const y1 = spec.base.height + spec.body.height;
    return [{ points: [new THREE.Vector3(-x, y, zz), new THREE.Vector3(-x, y1, zz), ...top, new THREE.Vector3(x, y1, zz), new THREE.Vector3(x, y, zz)], normal: Z }];
  },
  // Down both sides of the body, `offset` back from the front face.
  sides: (spec, { offset = 0.15 }) => {
    const z = CORE.faceZ - offset, y0 = spec.base.height + 0.02, y1 = spec.base.height + spec.body.height - 0.05;
    return [-1, 1].map((sx) => {
      const x = sx * (spec.body.width / 2 + 0.006);
      return { points: [new THREE.Vector3(x, y0, z), new THREE.Vector3(x, y1, z)], normal: X };
    });
  },
};

function curveOf({ points, closed = false }) {
  return points.length === 2
    ? new THREE.LineCurve3(points[0], points[1])
    : new THREE.CatmullRomCurve3(points, closed, 'centripetal');
}

/* A flat ribbon along a curve, lying on the surface (perpendicular to its
   normal), with v running across it: the glow texture fades its edges. */
function ribbon(curve, normal, half, closed, segments) {
  const pos = [], uv = [], idx = [], t = new THREE.Vector3(), side = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const u = i / segments, p = curve.getPointAt(u);
    curve.getTangentAt(u, t);
    side.crossVectors(t, normal).normalize().multiplyScalar(half);
    pos.push(p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z);
    uv.push(u, 0, u, 1);
    if (i < segments) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// Soft glow textures, white so a material colour tints them.
const glowLine = (renderer) => decal(4, 64, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
}, renderer);
const glowDot = (renderer) => decal(128, 128, (x, w) => {
  const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, w, w);
}, renderer);

const hot = (color, k) => new THREE.Color(color).lerp(new THREE.Color('#ffffff'), k);
const glowMat = (color, opacity, map) => new THREE.MeshBasicMaterial({
  color, map, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
});

/* Faceted star: a flat outline lifted to an apex, so every arm has two
   facets that catch the light differently. `arms` are radii, counter-clockwise from the top. */
function starGeometry(arms, inner, apex, rot = 0) {
  const n = arms.length, pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + Math.PI / 2 + (i * Math.PI) / n, r = i % 2 ? inner : arms[i / 2];
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const pos = [];
  pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; pos.push(0, 0, apex, p[0], p[1], 0, q[0], q[1], 0); });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// An extruded shape whose back and front faces land exactly on zBack and zFront.
function extrudeBetween(shape, zBack, zFront, bevel, curveSegments = 24) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, zFront - zBack - bevel * 2), curveSegments,
    bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3,
  });
  g.translate(0, 0, zBack + bevel);
  return g;
}

const ellipseShape = (a, b, steps = 48) => {
  const s = new THREE.Shape();
  for (let i = 0; i <= steps; i++) {
    const t = Math.PI * (1 - i / steps);
    if (i === 0) s.moveTo(Math.cos(t) * a, Math.sin(t) * b); else s.lineTo(Math.cos(t) * a, Math.sin(t) * b);
  }
  s.closePath();
  return s;
};

const NONE = () => {};

const CRESTS = {
  none: NONE,
  // A tall faceted four-point star, with a smaller one turned 45 degrees behind it.
  star({ group, spec, ...ctx }, z) {
    const k = spec.top.crest, y = spec.base.height + spec.body.height + k.y;
    const front = new THREE.Mesh(starGeometry([k.height / 2, k.width / 2, k.height / 2, k.width / 2], k.width * (k.waist ?? 0.14), k.apex),
      finishOf(ctx, k.finish, 'top.crest.finish'));
    front.position.set(0, y, z + 0.04);
    group.add(front);
    if (k.back) {
      const r = k.back.size;
      const back = new THREE.Mesh(starGeometry([r, r, r, r], r * 0.3, k.apex * 0.6, Math.PI / 4), finishOf(ctx, k.back.finish, 'top.crest.back'));
      back.position.set(0, y, z);
      group.add(back);
    }
  },
};

const TOPS = {
  flat: NONE,
  // A half-ellipse over the full width of the body: a solid hood, a rim
  // band at the front and a recessed panel inside it, with a crest.
  arch(ctx) {
    const { group, spec, materials, renderer, colors } = ctx;
    const t = spec.top, w = spec.body.width, y0 = spec.base.height + spec.body.height;
    const bevel = 0.03, a = w / 2 - bevel, b = t.rise - bevel;
    const zFront = CORE.faceZ, zRecess = zFront - t.recess, zBack = zFront - t.depth;

    const hood = new THREE.Mesh(extrudeBetween(ellipseShape(a, b), zBack, zRecess, bevel), materials.body);
    // Rim: the outer half-ellipse and the inner one, joined into a band open at the bottom.
    const band = new THREE.Shape();
    const ai = a - t.rim, bi = b - t.rim, N = 48;
    band.moveTo(-a, 0);
    for (let i = 1; i <= N; i++) { const q = Math.PI * (1 - i / N); band.lineTo(Math.cos(q) * a, Math.sin(q) * b); }
    for (let i = 0; i <= N; i++) { const q = Math.PI * (i / N); band.lineTo(Math.cos(q) * ai, Math.sin(q) * bi); }
    band.closePath();
    const rim = new THREE.Mesh(extrudeBetween(band, zRecess - 0.01, zFront, bevel), t.rimFinish ? finishOf(ctx, t.rimFinish, 'top.rimFinish') : materials.body);
    hood.position.y = rim.position.y = y0;
    group.add(hood, rim);

    // The panel inside the rim: rays fanning out from the bottom centre.
    if (t.panel) {
      const p = t.panel, W = 1024, H = Math.round(1024 * (bi / (2 * ai)));
      const tex = decal(W, H, (x) => {
        const bg = x.createRadialGradient(W / 2, H, 0, W / 2, H, H);
        bg.addColorStop(0, tint(colors, p.glow)); bg.addColorStop(1, tint(colors, p.base));
        x.fillStyle = bg; x.fillRect(0, 0, W, H);
        x.fillStyle = tint(colors, p.ray);
        for (let i = 0; i < p.rays; i++) {
          const a0 = Math.PI * (i + 0.18) / p.rays, a1 = Math.PI * (i + 0.82) / p.rays;
          x.globalAlpha = (i % 2 ? 0.5 : 1) * (p.strength ?? 0.8);
          x.beginPath(); x.moveTo(W / 2, H);
          x.lineTo(W / 2 - Math.cos(a0) * W, H - Math.sin(a0) * W);
          x.lineTo(W / 2 - Math.cos(a1) * W, H - Math.sin(a1) * W);
          x.closePath(); x.fill();
        }
      }, renderer);
      tex.repeat.set(1 / (2 * ai), 1 / bi);
      tex.offset.set(0.5, 0);
      const panel = new THREE.Mesh(new THREE.ShapeGeometry(ellipseShape(ai, bi), 24),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.3 }));
      panel.position.set(0, y0, zRecess + 0.002);
      group.add(panel);
    }
    part(CRESTS, t.crest?.shape ?? 'none', 'top.crest')(ctx, zRecess);
  },
};

const TRIMS = {
  none: NONE,
  // Neon tubes along named paths: a hot unlit core and a soft additive
  // halo lying on the surface. Optionally a polished bezel round the window.
  neon(ctx) {
    const { group, spec, colors, renderer } = ctx, n = spec.trim;
    const line = glowLine(renderer), mats = new Map();
    const matsFor = (name) => {
      if (!mats.has(name)) {
        const c = tint(colors, name);
        mats.set(name, [new THREE.MeshBasicMaterial({ color: hot(c, 0.55), toneMapped: false }), glowMat(c, n.glowOpacity ?? 0.6, line)]);
      }
      return mats.get(name);
    };
    for (const tube of n.tubes ?? []) {
      const [core, halo] = matsFor(tube.color);
      for (const path of part(PATHS, tube.path, 'trim.tubes')(spec, tube)) {
        const curve = curveOf(path), segs = Math.max(8, path.points.length * 3);
        group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, segs, n.radius, 6, !!path.closed), core));
        const h = new THREE.Mesh(ribbon(curve, path.normal, n.glow, !!path.closed, segs), halo);
        h.renderOrder = 2;
        group.add(h);
      }
    }
    if (n.bezel) {
      const c = CORE, { from, to } = n.bezel;
      const ring = roundedRect(new THREE.Shape(), -c.winW / 2 - to, c.winY - c.winH / 2 - to, c.winW + to * 2, c.winH + to * 2, 0.05 + to);
      ring.holes.push(roundedRect(new THREE.Path(), -c.winW / 2 - from, c.winY - c.winH / 2 - from, c.winW + from * 2, c.winH + from * 2, 0.05 + from));
      group.add(new THREE.Mesh(extrudeBetween(ring, c.plateFront - 0.01, c.plateFront + n.bezel.height, 0.012, 8), finishOf(ctx, n.bezel.finish, 'trim.bezel')));
    }
  },
};

const LIGHTS = {
  none: () => ({}),
  // Bulbs spaced evenly along a path: one InstancedMesh for the glass and
  // one for the halos, so every bulb costs no extra draw call. A chase
  // dims and brightens them in turn by writing per-instance colours.
  bulbs(ctx) {
    const { group, spec, colors, renderer } = ctx, l = spec.lights;
    const [path] = part(PATHS, l.path, 'lights.path')(spec, l);
    const curve = curveOf(path), n = l.count, color = new THREE.Color(tint(colors, l.color));
    const glass = new THREE.InstancedMesh(new THREE.SphereGeometry(l.size, 16, 12),
      new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), n);
    const halo = new THREE.InstancedMesh(new THREE.PlaneGeometry(l.size * 5, l.size * 5), glowMat('#ffffff', 0.9, glowDot(renderer)), n);
    halo.renderOrder = 2;
    const m = new THREE.Matrix4(), p = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      curve.getPointAt(n > 1 ? i / (n - 1) : 0.5, p);
      glass.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z + l.size * 0.3));
      halo.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z + l.size * 1.4));
    }
    group.add(glass, halo);

    const lit = hot(color, 0.3), dim = color.clone().multiplyScalar(0.35), c = new THREE.Color();
    let step = -1, acc = 0;
    function paint(s) {
      for (let i = 0; i < n; i++) {
        const on = s < 0 || (i + s) % 3 !== 0;
        glass.setColorAt(i, on ? lit : dim);
        halo.setColorAt(i, c.copy(color).multiplyScalar(on ? 1 : 0.15));
      }
      glass.instanceColor.needsUpdate = halo.instanceColor.needsUpdate = true;
    }
    paint(-1);
    return {
      // A slow chase, stepped, so the canvas only redraws a few times a second.
      tick(dt, live) {
        if (!l.chase || !live) { if (step !== -1) { step = -1; paint(-1); return true; } return false; }
        acc += dt;
        if (acc < l.chase) return false;
        acc = 0; step = (step + 1) % 3; paint(step);
        return true;
      },
    };
  },
};

// A coloured glow on the floor, as if the neon lit it.
function floorGlow({ group, spec, colors, renderer }) {
  const f = spec.lights.floor;
  if (!f) return;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(f.width, f.depth), glowMat(tint(colors, f.color), f.opacity, glowDot(renderer)));
  m.rotation.x = -Math.PI / 2;
  m.position.set(0, 0.004, CORE.faceZ - spec.body.depth / 2);
  group.add(m);
}

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
  // A polished plinth under the body, reaching forward under a coin tray.
  plinth(ctx) {
    const { group, spec } = ctx, p = spec.base, b = spec.body;
    const metal = finishOf(ctx, p.finish, 'base.finish');
    const back = CORE.faceZ - b.depth - p.overhang, front = p.front;
    const slab = new THREE.Mesh(new RoundedBoxGeometry(b.width + p.overhang * 2, p.height, front - back, 3, Math.min(0.03, p.height / 2.5)), metal);
    slab.position.set(0, p.height / 2, (front + back) / 2);
    group.add(slab);
    if (p.tray) {
      // An open box: walls extruded upwards from a ring, and a dark floor.
      const t = p.tray, zb = CORE.plateFront - 0.06, zf = front - 0.05, d = zf - zb, wall = 0.05;
      const ring = roundedRect(new THREE.Shape(), -t.width / 2, 0, t.width, d, 0.08);
      ring.holes.push(roundedRect(new THREE.Path(), -t.width / 2 + wall, wall, t.width - wall * 2, d - wall * 2, 0.05));
      const walls = new THREE.Mesh(extrudeBetween(ring, 0, t.height, 0.015, 8), metal);
      walls.rotation.x = Math.PI / 2;               // shape y becomes depth, extrusion goes up
      walls.position.set(0, p.height + t.height, zb);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(t.width - wall * 2, d - wall * 2),
        new THREE.MeshStandardMaterial({ color: tint(ctx.colors, t.inside), roughness: 0.6 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, p.height + 0.02, zb + d / 2);
      group.add(walls, floor);
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
  // A small bulb per slot. Lit, it glows and throws a halo.
  bulbs({ group, spec, colors, renderer }) {
    const { xs, y, z } = CORE.indicators, i = spec.indicators, color = tint(colors, i.color);
    // Unlit: dark glass. Lit: the full colour, with a halo blended normally
    // (an additive glow vanishes on a light front plate).
    const off = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.14), roughness: 0.3 });
    const on = new THREE.MeshBasicMaterial({ color: hot(color, 0.15), toneMapped: false });
    const geo = new THREE.SphereGeometry(i.size, 20, 14);
    const haloGeo = new THREE.PlaneGeometry(i.size * 6, i.size * 6);
    const haloMat = new THREE.MeshBasicMaterial({ color, map: glowDot(renderer), transparent: true, opacity: 0.75, depthWrite: false, toneMapped: false });
    const bulbs = xs.map((x) => {
      const m = new THREE.Mesh(geo, off), h = new THREE.Mesh(haloGeo, haloMat);
      m.position.set(x, y, z);
      h.position.set(x, y, z + i.size * 1.5);
      h.visible = false; h.renderOrder = 2;
      group.add(m, h);
      return [m, h];
    });
    return {
      set(index) { bulbs.forEach(([m, h], k) => { m.material = k === index ? on : off; h.visible = k === index; }); },
      materials: [on, off],
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
  const { font, weight } = spec.decals, ink = tint(colors, spec.decals.ink);
  const face = (px) => `${weight} ${px}px ${font}`;
  const printMat = (tex) => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });

  const nameplate = decal(2048, 220, (x, w, h) => {
    x.fillStyle = ink;
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
    x.fillStyle = ink;
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
    x.fillStyle = ink;
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

  group.add(numbersMesh);
  if (spec.decals.nameplate) group.add(name); else disposeAll([name]);
  if (spec.decals.print) group.add(printMesh); else disposeAll([printMesh]);
}

// ----------------------------------------------------------------- build

export function buildCabinet(renderer, cabinetSpec, colors, count) {
  const spec = resolveSpec(cabinetSpec);
  const c = CORE, b = spec.body;
  const group = new THREE.Group();
  // Finishes: one for the body, one for the fascia, so it reads as one designed object.
  const bodyMat = finishOf({ colors, renderer }, spec.finish.body, 'finish.body');
  const fasciaMat = finishOf({ colors, renderer }, spec.finish.fascia, 'finish.fascia');
  const ctx = { group, spec, colors, count, renderer, materials: { body: bodyMat, fascia: fasciaMat } };

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
  const lights = part(LIGHTS, spec.lights.style, 'lights')(ctx);
  part(BASES, spec.base.style, 'base')(ctx);
  printDecals(ctx);
  const indicators = part(INDICATORS, spec.indicators.style, 'indicators')(ctx);

  // Check the themeable parts against the envelope before the core joins them.
  const box = new THREE.Box3().setFromObject(group);
  const env = spec.envelope, eps = 1e-3;
  const fits = box.min.x >= env.min[0] - eps && box.min.y >= env.min[1] - eps && box.min.z >= env.min[2] - eps
    && box.max.x <= env.max[0] + eps && box.max.y <= env.max[1] + eps && box.max.z <= env.max[2] + eps;
  if (!fits) console.warn('Cabinet is outside the envelope.', box, env);
  floorGlow(ctx);            // light on the floor, like the contact shadow: not part of the body

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
  // The lever's hub, collar and mount wear the lever finish if the theme gives one.
  const leverMat = spec.lever.finish ? finishOf(ctx, spec.lever.finish, 'lever.finish') : null;
  const mount = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.7, 0.7, 4, 0.05), leverMat ?? bodyMat);
  mount.position.set(c.lever.mountX, c.lever.y, 0);
  group.add(mount);

  // Everything above is this build's own. The reels and lever join later
  // and dispose of themselves.
  const own = [...group.children];
  let led = -1;

  return {
    group,
    materials: { body: leverMat ?? bodyMat, fascia: leverMat ?? fasciaMat },
    glass, sweep, payline, marks, shades: [shadeTop, shadeBottom],
    fits,
    frame: frameFor(spec.envelope),
    knobColor: tint(colors, spec.lever.color),
    tick: (dt, live) => lights.tick?.(dt, live) ?? false,
    get led() { return led; },
    setLed(index) { led = index; indicators.set(index); },
    dispose() { disposeAll(own, indicators.materials); },
  };
}
