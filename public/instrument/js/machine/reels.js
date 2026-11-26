/*
 * Concept: velocity-matched easing.
 * A reel that is spinning at speed v must start to slow down at exactly
 * speed v, or you see a hitch. An ease-out curve 1 - (1 - t)^k starts with
 * slope k, so for a stop of distance d its duration must be k * d / v.
 * We pick the landing angle first (the outcome is decided, never random),
 * then solve for the time. Each reel uses a different k, so they settle
 * with slightly different characters, then bounce once and rest.
 *
 * Geometry: each reel is 8 cylinder segments (the four studies, twice),
 * so each face gets its own high resolution texture.
 */
import * as THREE from 'three';
import { CORE } from './cabinet.js';
import { disposeAll } from './dispose.js';
import { dur } from '../tokens.js';
import { smoothstep } from '../motion.js';

const N = CORE.cells;
const STEP = (Math.PI * 2) / N;
const VMAX = 15;                 // rad/s at full spin
const K = [3, 3.6, 4.4];         // ease-out power per reel
const OVERSHOOT = 0.05;          // radians past the stop, then back

/* The reel group rotates around X by phi. Cell k faces the viewer when
   phi = -k * STEP. Cells k and k+4 carry the same study, so any phi that
   is -s * STEP modulo PI shows study s. */
function landingAngle(study, atLeast) {
  const base = -study * STEP;
  return base + Math.ceil((atLeast - base) / Math.PI) * Math.PI;
}

function segmentGeometry(k) {
  const g = new THREE.CylinderGeometry(CORE.R, CORE.R, CORE.reelW, 28, 1, true, k * STEP - STEP / 2, STEP);
  // Swap UVs so the texture runs around the reel, top of cell first.
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, v, 1 - u); }
  g.rotateZ(-Math.PI / 2);       // cylinder axis from Y to X
  return g;
}

export function createReels({ textures, blur, colors, onStop }) {
  const root = new THREE.Group();
  root.position.set(0, CORE.winY, CORE.reelZ);

  const faces = textures.map((map) => new THREE.MeshStandardMaterial({
    map, color: '#c4c4c4', roughness: 0.6, metalness: 0, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.12,
  }));
  const geos = Array.from({ length: N }, (_, k) => segmentGeometry(k));
  const blurGeo = (() => {
    const g = new THREE.CylinderGeometry(CORE.R * 1.003, CORE.R * 1.003, CORE.reelW, 64, 1, true, -STEP / 2, Math.PI * 2);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, v, 1 - u); }
    return g.rotateZ(-Math.PI / 2);
  })();
  const capMat = new THREE.MeshStandardMaterial({ color: colors.graphite, roughness: 0.5, metalness: 0.4 });
  const capGeo = new THREE.CircleGeometry(CORE.R * 0.995, 48);

  const reels = CORE.reelXs.map((x, i) => {
    const g = new THREE.Group();
    g.position.x = x;
    geos.forEach((geo, k) => g.add(new THREE.Mesh(geo, faces[k % faces.length])));
    const blurMat = new THREE.MeshBasicMaterial({ map: blur, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    const blurMesh = new THREE.Mesh(blurGeo, blurMat);
    blurMesh.renderOrder = 1;
    g.add(blurMesh);
    for (const side of [-1, 1]) {
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.rotation.y = side * Math.PI / 2;
      cap.position.x = side * CORE.reelW / 2;
      g.add(cap);
    }
    root.add(g);
    return { i, g, blurMat, phi: 0, prev: 0, speed: 0, mode: 'rest', t: 0, from: 0, to: 0, dist: 0, duration: 0, target: 0, stopAt: 0 };
  });

  let elapsed = 0;
  let resolveSpin = null;
  let study = 0;

  function show(indices) {
    reels.forEach((r, i) => { r.phi = r.prev = landingAngle(indices[i], 0) - Math.PI; r.mode = 'rest'; r.g.rotation.x = r.phi; });
  }

  function spin(target) {
    study = target;
    elapsed = 0;
    reels.forEach((r) => {
      r.mode = 'accel'; r.t = 0;
      r.stopAt = dur.spinMin + r.i * dur.reelGap;
    });
    return new Promise((res) => { resolveSpin = res; });
  }

  // Interrupt: snap every reel to the outcome, keep the promise contract.
  function snap(target = study) {
    reels.forEach((r) => { r.phi = landingAngle(target, r.phi); r.mode = 'rest'; r.speed = 0; r.blurMat.opacity = 0; r.g.rotation.x = r.phi; });
    if (resolveSpin) { const r = resolveSpin; resolveSpin = null; r(false); }
  }

  // Idle attract: every reel steps forward one face, staggered.
  function nudge() {
    if (reels.some((r) => r.mode !== 'rest')) return;
    reels.forEach((r) => { r.mode = 'nudge'; r.t = -r.i * 0.12; r.from = r.phi; r.to = r.phi + STEP; });
  }

  function update(dt) {
    elapsed += dt * 1000;
    let moving = false;
    for (const r of reels) {
      r.prev = r.phi;
      if (r.mode === 'accel') {
        r.t += dt;
        const v = VMAX * smoothstep(0, 0.28, r.t);
        r.phi += (r.t < 0.07 ? -2.5 : v) * dt;   // a tiny kick back before it goes
        if (elapsed >= r.stopAt && r.t > 0.28) beginStop(r);
      } else if (r.mode === 'stop') {
        r.t += dt;
        const p = Math.min(1, r.t / r.duration);
        r.phi = r.from + r.dist * (1 - Math.pow(1 - p, K[r.i]));
        if (p >= 1) { r.mode = 'bounce'; r.t = 0; onStop?.(r.i); }
      } else if (r.mode === 'bounce') {
        r.t += dt;
        // Critically shaped wobble: starts at rest, decays back to target.
        const tau = 0.075, w = (Math.PI * 2) / 0.3;
        const s = OVERSHOOT * Math.exp(-r.t / tau) * (Math.cos(w * r.t) + Math.sin(w * r.t) / (w * tau));
        r.phi = r.target + s;
        if (r.t * 1000 >= dur.settle) { r.phi = r.target; r.mode = 'rest'; }
      } else if (r.mode === 'nudge') {
        r.t += dt;
        const p = Math.min(1, Math.max(0, r.t / 0.7));
        const back = 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2); // ease-out-back
        r.phi = r.from + (r.to - r.from) * back;
        if (p >= 1) { r.phi = r.to; r.mode = 'rest'; }
      }
      r.speed = Math.abs(r.phi - r.prev) / Math.max(dt, 1e-4);
      r.blurMat.opacity = smoothstep(5, 13, r.speed);
      r.g.rotation.x = r.phi;
      if (r.mode !== 'rest') moving = true;
    }
    if (resolveSpin && reels.every((r) => r.mode === 'rest')) { const res = resolveSpin; resolveSpin = null; res(true); }
    return moving;
  }

  function beginStop(r) {
    const v = VMAX;
    const minDist = (v * (dur.reelStop + r.i * 60) / 1000) / K[r.i];
    r.target = landingAngle(study, r.phi + minDist * 0.7);
    r.from = r.phi;
    r.dist = r.target + OVERSHOOT - r.phi;
    r.duration = (K[r.i] * r.dist) / v;
    r.mode = 'stop'; r.t = 0;
  }

  return {
    root, update, spin, snap, show, nudge,
    // Where each reel rests (a nudge in flight counts as done), and back again.
    pose: () => reels.map((r) => (r.mode === 'nudge' ? r.to : r.phi)),
    restore(phis) { reels.forEach((r, i) => { r.phi = r.prev = phis[i]; r.mode = 'rest'; r.g.rotation.x = r.phi; }); },
    dispose() { disposeAll([root]); },
    get busy() { return reels.some((r) => r.mode !== 'rest' && r.mode !== 'nudge'); },
    firstStopped: () => reels.some((r) => r.mode === 'bounce' || (r.mode === 'rest' && r.speed === 0)),
  };
}
