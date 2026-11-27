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
  // corner: 'round' (radius rounds every edge) or 'chamfer' (radius cuts the
  // vertical corners at 45 degrees; fasciaRadius chamfers the fascia).
  body: { width: FIRST.W, height: FIRST.H, depth: FIRST.D, radius: 0.14, fasciaInset: 0.06, fasciaRadius: 0.1, corner: 'round' },
  // 'flat', or 'arch': rise, depth (front to back), rim (band width),
  // recess (how far the panel sits back), panel (sunburst), crest.
  top: { shape: 'flat', rise: 0 },
  finish: {
    body: { preset: 'lacquer', color: 'graphite' },
    fascia: { preset: 'brushed', color: 'alu' },
  },
  // 'none', or 'neon': tubes along named paths. With any style: `bezel`
  // round the window, `plates` (armour on any face), `edges` (strips on
  // chamfered corners) and `grille` (a round speaker grille).
  trim: { style: 'none' },
  // `labels`: extra printed words, [{ text, x, y, size, color, lift }].
  decals: { font: '"IBM Plex Mono", monospace', weight: 500, grille: 'dots', ink: 'ink', nameplate: true, print: true },
  // 'none', or 'bulbs': instanced along a path, with an optional chase.
  // `floor` adds a coloured glow on the floor under the machine, and
  // `bubbles` ([x, y, z, radius] each) float soap bubbles round it.
  lights: { style: 'none' },
  base: { style: 'feet', height: FIRST.FEET },   // or 'plinth', with a tray
  indicators: { style: 'led' },                  // or 'bulbs'
  // Optional `finish` for the hub and mount. guard: 'none' or 'shoulder'
  // (an armour plate over the lever, hinged, that lifts as you pull).
  lever: { knob: 'ball', guard: 'none', color: 'accent' },
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

function chamferRect(shape, x, y, w, h, c) {
  shape.moveTo(x + c, y);
  shape.lineTo(x + w - c, y); shape.lineTo(x + w, y + c);
  shape.lineTo(x + w, y + h - c); shape.lineTo(x + w - c, y + h);
  shape.lineTo(x + c, y + h); shape.lineTo(x, y + h - c);
  shape.lineTo(x, y + c); shape.closePath();
  return shape;
}
const cornered = (corner) => (corner === 'chamfer' ? chamferRect : roundedRect);
const polygon = (pts) => new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v)));

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
  // Painted armour: a soft sheen, no clear coat.
  satin: (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, metalness: 0.15, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
  // Fake glass: a thin transparent tint with a hard clear coat. The edges
  // come from a Fresnel rim layer (see `rim` on a finish), not transmission.
  glass: (color) => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4,
    transparent: true, opacity: 0.3, depthWrite: false,
  }),
  // Polished metal. Tinted, it is gold or anodised colour.
  chrome: (color) => new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: 0.14 }),
};

function finishOf({ colors, renderer }, f, slot) {
  const m = part(FINISHES, f.preset, slot)(tint(colors, f.color), renderer);
  if (f.opacity != null) Object.assign(m, { opacity: f.opacity, transparent: true, depthWrite: false });
  if (f.env != null) m.envMapIntensity = f.env;            // brighter reflections, for chrome on a light page
  if (f.roughness != null) m.roughness = f.roughness;
  return m;
}

/* Concept: a Fresnel rim. Surfaces seen edge-on reflect more light, so
   glass looks bright at its silhouette and clear face-on. This shader
   draws only that: alpha rises as the surface turns away from the eye.
   `film` tints the very edge pink, like a soap film; `spec` adds a hot spot. */
function rimMaterial(colors, { color, power = 2.5, strength = 0.8, base = 0, spec = 0, film = false }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(tint(colors, color)) }, uPower: { value: power }, uStrength: { value: strength },
      uBase: { value: base }, uSpec: { value: spec }, uFilm: { value: film ? 1 : 0 },
    },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uPower, uStrength, uBase, uSpec, uFilm; varying vec3 vN; varying vec3 vV;
      void main() {
        vec3 n = normalize(vN), v = normalize(vV);
        float f = pow(1.0 - abs(dot(n, v)), uPower);
        vec3 L = normalize(vec3(-0.4, 0.6, 0.7));
        float s = pow(max(dot(reflect(-L, n), v), 0.0), 60.0) * uSpec;
        vec3 c = mix(uColor, vec3(1.0, 0.78, 0.95), smoothstep(0.5, 1.0, f) * uFilm * 0.7);
        float a = clamp(f * uStrength + uBase + s, 0.0, 1.0);
        gl_FragColor = vec4(c + s, a);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false,
  });
}

// ------------------------------------------------------------------ paths
/* Named lines across the cabinet, all derived from the body, the top and
   the reel window, so any theme can hang neon or bulbs on them. Each path
   gives one or more polylines and the normal of the surface it lies on. */
const Z = new THREE.Vector3(0, 0, 1), X = new THREE.Vector3(1, 0, 0);
const planeZ = (spec, at) => (typeof at === 'number' ? at : {
  plate: CORE.plateFront + 0.008,
  face: CORE.faceZ + 0.008,
  recess: CORE.faceZ - (spec.top.recess ?? 0) + 0.008,
}[at]);

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
function extrudeBetween(shape, zBack, zFront, bevel, curveSegments = 24, bevelSegments = 3) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, zFront - zBack - bevel * 2), curveSegments,
    bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments,
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

/* A box whose vertical corners are cut at 45 degrees (radius wide) and
   whose top and bottom edges carry a small flat bevel. Its plan is
   extruded upwards, then centred like a box. */
function chamferedBox(b) {
  const e = 0.04;
  const plan = chamferRect(new THREE.Shape(), -b.width / 2 + e, -b.depth / 2 + e, b.width - e * 2, b.depth - e * 2, Math.max(0.001, b.radius - e * 0.4));
  const g = new THREE.ExtrudeGeometry(plan, { depth: b.height - e * 2, bevelEnabled: true, bevelThickness: e, bevelSize: e, bevelSegments: 1 });
  return g.translate(0, 0, e).rotateX(-Math.PI / 2).translate(0, -b.height / 2, 0);
}

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
  },
};

/* Trim that any style can carry. */
const TRIM_EXTRAS = {
  // A ring round the reel window, rounded or chamfered.
  bezel(ctx, z) {
    const c = CORE, { from, to, corner } = z, shape = cornered(corner);
    const ring = shape(new THREE.Shape(), -c.winW / 2 - to, c.winY - c.winH / 2 - to, c.winW + to * 2, c.winH + to * 2, 0.05 + to);
    ring.holes.push(roundedRect(new THREE.Path(), -c.winW / 2 - from, c.winY - c.winH / 2 - from, c.winW + from * 2, c.winH + from * 2, 0.05 + from));
    ctx.group.add(new THREE.Mesh(extrudeBetween(ring, c.plateFront - 0.01, c.plateFront + z.height, 0.012, 8, corner === 'chamfer' ? 1 : 3),
      finishOf(ctx, z.finish, 'trim.bezel')));
  },
  // Armour plates: flat polygons with chamfered edges, laid on a face.
  // front: points are (x, y), on `on` (a plane name or a z). left / right:
  // points are (z, y), on the side. top: points are (x, z), on the top.
  plates(ctx, list) {
    const { group, spec, colors, renderer } = ctx, b = spec.body;
    const top = spec.base.height + b.height, mats = new Map();
    const matFor = (p) => {
      const key = JSON.stringify([p.finish, p.pattern]);
      if (!mats.has(key)) {
        const m = finishOf(ctx, p.finish, 'trim.plates.finish');
        if (p.pattern) {
          // Hazard stripes. Extruded caps carry their shape's coordinates as
          // UVs (world units), so the texture repeats once per stripe period.
          const [a, z] = p.pattern.colors.map((n) => tint(colors, n));
          m.map = decal(64, 64, (x, w) => {
            x.fillStyle = z; x.fillRect(0, 0, w, w);
            x.fillStyle = a;
            // A 45 degree band shifts a full tile per tile height, so tiles meet.
            for (const o of [-w, 0]) { x.beginPath(); x.moveTo(o, w); x.lineTo(o + w / 2, w); x.lineTo(o + w * 1.5, 0); x.lineTo(o + w, 0); x.closePath(); x.fill(); }
          }, renderer);
          m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping;
          m.map.repeat.set(1 / p.pattern.period, 1 / p.pattern.period);
          m.color.set('#ffffff');
        }
        mats.set(key, m);
      }
      return mats.get(key);
    };
    for (const p of list) {
      const d = p.depth ?? 0.04, bevel = Math.min(0.015, d / 3);
      const flip = p.face === 'right' ? p.points.map(([u, v]) => [-u, v]) : p.face === 'top' ? p.points.map(([u, v]) => [u, -v]) : p.points;
      const g = extrudeBetween(polygon(flip), -0.004, d, bevel, 4, 1);
      if (p.face === 'right') g.rotateY(Math.PI / 2).translate(b.width / 2 + (p.out ?? 0), 0, 0);
      else if (p.face === 'left') g.rotateY(-Math.PI / 2).translate(-b.width / 2 - (p.out ?? 0), 0, 0);
      else if (p.face === 'top') g.rotateX(-Math.PI / 2).translate(0, top + (p.out ?? 0), 0);
      else g.translate(0, 0, planeZ(spec, p.on ?? 'plate') - 0.008);
      group.add(new THREE.Mesh(g, matFor(p)));
    }
  },
  // Strips on the two front vertical corners, when the body is chamfered.
  edges(ctx, e) {
    const { group, spec } = ctx, b = spec.body, c = b.radius, m = finishOf(ctx, e.finish, 'trim.edges.finish');
    const t = e.thickness ?? 0.03, along = c * Math.SQRT2 * (e.cover ?? 0.6);
    for (const [y0, y1] of e.segments) {
      const geo = new THREE.BoxGeometry(along, y1 - y0, t);
      for (const sx of [-1, 1]) {
        const s = new THREE.Mesh(geo, m);
        const n = Math.SQRT1_2 * t / 2;
        s.position.set(sx * (b.width / 2 - c / 2 + n), spec.base.height + (y0 + y1) / 2, CORE.faceZ - c / 2 + n);
        s.rotation.y = sx * Math.PI / 4;
        group.add(s);
      }
    }
  },
  // A round speaker grille: a dark disc of holes in a raised ring.
  grille(ctx, g) {
    const { group, spec, colors, renderer } = ctx, z = planeZ(spec, g.on ?? 'plate');
    const tex = decal(512, 512, (x, w) => {
      x.fillStyle = tint(colors, g.color); x.beginPath(); x.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(0,0,0,0.85)';
      const step = w / (g.rows ?? 15);
      for (let r = 0; r * step < w; r++) for (let q = 0; q * step < w; q++) {
        const cx = q * step + (r % 2 ? step / 2 : 0) + step / 4, cy = r * step * 0.87 + step / 2;
        if (Math.hypot(cx - w / 2, cy - w / 2) < w / 2 - step * 0.8) { x.beginPath(); x.arc(cx, cy, step * 0.26, 0, Math.PI * 2); x.fill(); }
      }
    }, renderer);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(g.r, 48), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6 }));
    disc.position.set(g.x, g.y, z);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(g.r, 0.025, 8, 48), finishOf(ctx, g.ring, 'trim.grille.ring'));
    ring.position.set(g.x, g.y, z);
    group.add(disc, ring);
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

/* Guards over the core lever. The guard hangs from a hinge on the body's
   side and lifts as the lever is pulled (update gets the lever's travel). */
const GUARDS = {
  none: () => ({}),
  shoulder(ctx) {
    const { group, spec } = ctx, g = spec.lever, b = spec.body;
    const hinge = new THREE.Group();
    hinge.position.set(b.width / 2, spec.base.height + b.height - 0.02, 0);
    // A wedge seen from the front, (x, y) from the hinge, extruded between
    // two depths behind the lever's travel. Panels sit on its front face.
    const [z0, z1] = g.guardDepth;
    hinge.add(new THREE.Mesh(extrudeBetween(polygon(g.guardShape), z0, z1, 0.03, 4, 1), finishOf(ctx, g.guardFinish, 'lever.guardFinish')));
    for (const p of g.guardPanels ?? []) {
      hinge.add(new THREE.Mesh(extrudeBetween(polygon(p.points), z1 - 0.01, z1 + 0.025, 0.008, 4, 1), finishOf(ctx, p.finish, 'lever.guardPanels')));
    }
    group.add(hinge);
    return { update(theta) { hinge.rotation.z = Math.max(0, theta) * (g.guardLift ?? 0.35); } };
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
    // The slab can stand on feet: `slab` is its thickness, the feet fill the rest of `height`.
    const slabH = p.slab ?? p.height, feetH = p.height - slabH;
    const slab = new THREE.Mesh(new RoundedBoxGeometry(b.width + p.overhang * 2, slabH, front - back, 4, p.radius ?? Math.min(0.03, slabH / 2.5)), metal);
    slab.position.set(0, feetH + slabH / 2, (front + back) / 2);
    group.add(slab);
    if (feetH > 0) {
      // Flattened balls under the corners.
      const r = p.footRadius ?? 0.16, geo = new THREE.SphereGeometry(r, 24, 12).scale(1, feetH / (2 * r), 1);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const f = new THREE.Mesh(geo, metal);
        f.position.set(sx * (b.width / 2 - r), feetH / 2 + 0.002, sz > 0 ? CORE.faceZ - r : CORE.faceZ - b.depth + r);
        group.add(f);
      }
    }
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
  led({ group, spec, colors }) {
    const { xs, y, z } = CORE.indicators, lit = tint(colors, spec.indicators.color ?? 'accent');
    const off = new THREE.MeshStandardMaterial({ color: '#3a3836', roughness: 0.4 });
    const on = new THREE.MeshStandardMaterial({ color: lit, emissive: lit, emissiveIntensity: 1.6, roughness: 0.3, toneMapped: false });
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

  // Free labels: one small plane each, sized to its text.
  for (const l of spec.decals.labels ?? []) {
    const px = 96, pad = 8;
    const measure = document.createElement('canvas').getContext('2d');
    measure.font = face(px);
    const w = Math.ceil(measure.measureText(l.text).width) + pad * 2;
    const tex = decal(w, px + pad * 2, (x, cw, ch) => {
      x.font = face(px); x.fillStyle = tint(colors, l.color ?? spec.decals.ink);
      x.textBaseline = 'middle'; x.fillText(l.text, pad, ch / 2 + px * 0.06);
    }, renderer);
    const h = l.size, m = new THREE.Mesh(new THREE.PlaneGeometry(h * w / (px + pad * 2), h), printMat(tex));
    m.position.set(l.x, l.y, L.z + (l.lift ?? 0));
    group.add(m);
  }
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
  const body = new THREE.Mesh(b.corner === 'chamfer' ? chamferedBox(b) : new RoundedBoxGeometry(b.width, b.height, b.depth, 6, b.radius), bodyMat);
  body.position.set(0, bodyY, bodyZ);
  group.add(body);
  if (spec.finish.body.rim) {
    const rim = new THREE.Mesh(body.geometry, rimMaterial(colors, spec.finish.body.rim));
    rim.position.copy(body.position);
    rim.renderOrder = 3;
    group.add(rim);
  }

  // Fascia with the reel window cut out (an extruded shape with a hole, so
  // the window has real depth). Front face in the fascia finish, edges in the body's.
  const inset = b.fasciaInset + c.bevel;
  const outer = cornered(b.corner)(new THREE.Shape(), -b.width / 2 + inset, -b.height / 2 + inset, b.width - inset * 2, b.height - inset * 2, b.fasciaRadius);
  outer.holes.push(roundedRect(new THREE.Path(), -c.winW / 2 - c.bevel, c.winY - bodyY - c.winH / 2 - c.bevel,
    c.winW + c.bevel * 2, c.winH + c.bevel * 2, 0.05));
  const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, {
    depth: c.plateDepth, bevelEnabled: true, bevelThickness: c.bevel, bevelSize: c.bevel, bevelSegments: b.corner === 'chamfer' ? 1 : 4, curveSegments: 10,
  }), [fasciaMat, bodyMat]);
  plate.position.set(0, bodyY, c.plateBack + c.bevel);
  group.add(plate);
  if (spec.finish.fascia.rim) {
    const rim = new THREE.Mesh(plate.geometry, rimMaterial(colors, spec.finish.fascia.rim));
    rim.position.copy(plate.position);
    rim.renderOrder = 3;
    group.add(rim);
  }

  // Themeable slots.
  part(TOPS, spec.top.shape, 'top')(ctx);
  part(TRIMS, spec.trim.style, 'trim')(ctx);
  for (const k of ['bezel', 'plates', 'edges', 'grille']) if (spec.trim[k]) TRIM_EXTRAS[k](ctx, spec.trim[k]);
  const lights = part(LIGHTS, spec.lights.style, 'lights')(ctx);
  part(BASES, spec.base.style, 'base')(ctx);
  printDecals(ctx);
  const guard = part(GUARDS, spec.lever.guard, 'lever.guard')(ctx);
  const indicators = part(INDICATORS, spec.indicators.style, 'indicators')(ctx);

  // Check the themeable parts against the envelope before the core joins them.
  const box = new THREE.Box3().setFromObject(group);
  const env = spec.envelope, eps = 1e-3;
  const fits = box.min.x >= env.min[0] - eps && box.min.y >= env.min[1] - eps && box.min.z >= env.min[2] - eps
    && box.max.x <= env.max[0] + eps && box.max.y <= env.max[1] + eps && box.max.z <= env.max[2] + eps;
  if (!fits) console.warn(`Cabinet is outside the envelope: min ${box.min.toArray().map((v) => v.toFixed(2))}, max ${box.max.toArray().map((v) => v.toFixed(2))}.`);
  floorGlow(ctx);            // light on the floor, like the contact shadow: not part of the body
  if (spec.lights.bubbles) {
    // Soap bubbles floating round the machine: all rim, no body.
    const mat = rimMaterial(colors, { color: '#e6f6ff', power: 3, strength: 0.95, base: 0, spec: 1, film: true });
    const geo = new THREE.SphereGeometry(1, 32, 24);
    for (const [x, y, z, r] of spec.lights.bubbles) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z); m.scale.setScalar(r); m.renderOrder = 4;
      group.add(m);
    }
  }

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
    tick(dt, live, leverTheta = 0) {
      guard.update?.(leverTheta);
      return lights.tick?.(dt, live) ?? false;
    },
    get led() { return led; },
    setLed(index) { led = index; indicators.set(index); },
    dispose() { disposeAll(own, indicators.materials); },
  };
}
