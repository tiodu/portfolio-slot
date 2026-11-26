/*
 * Concept: a damped spring.
 * The lever has a position (theta, 0 at rest, 1 fully pulled) and a
 * velocity. Each frame a spring pulls it towards a target and damping
 * bleeds off speed. Low damping means overshoot, which is what makes the
 * return feel weighty. Dragging just moves the target, with a stiffer,
 * heavier spring, so the lever lags your hand a touch, like mass would.
 */
import * as THREE from 'three';
import { CORE, part } from './cabinet.js';
import { disposeAll } from './dispose.js';

const REST = -0.12;       // radians: leaning back slightly
const PULLED = 1.08;      // radians: down towards the viewer

const SPRINGS = {
  release: { k: 140, c: 9 },    // underdamped: overshoots past rest, settles
  drag:    { k: 900, c: 55 },   // follows the hand with a little lag
  auto:    { k: 260, c: 18 },   // the button pull: quick, deliberate
};

// Parts for the theme's lever slot. Later slices add a hinged guard.
const KNOBS = {
  ball: () => new THREE.SphereGeometry(0.17, 48, 32),
};
const GUARDS = { none: () => {} };

/* The pivot, length and travel are core. The knob and any guard come
   from the theme's spec; the hub and collar wear the cabinet's finishes. */
export function createLever({ materials, accent, spec = { knob: 'ball', guard: 'none' } }) {
  const L = CORE.lever.length;
  const pivot = new THREE.Group();
  pivot.position.set(CORE.lever.x, CORE.lever.y, 0);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.14, 40).rotateZ(Math.PI / 2), materials.body);
  pivot.add(hub);
  const arm = new THREE.Group();
  pivot.add(arm);
  const polished = new THREE.MeshPhysicalMaterial({ color: '#d9d9d6', metalness: 1, roughness: 0.16 });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.046, L, 24).translate(0, L / 2, 0), polished);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 24).translate(0, 0.1, 0), materials.fascia);
  const knob = new THREE.Mesh(part(KNOBS, spec.knob, 'lever.knob')(), new THREE.MeshPhysicalMaterial({
    color: accent, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08,
  }));
  knob.position.y = L;
  arm.add(rod, collar, knob);
  part(GUARDS, spec.guard, 'lever.guard')({ pivot, arm, materials });

  // Generous invisible hit area: thumbs are bigger than the knob.
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = L * 0.82;
  arm.add(hit);

  let theta = 0, vel = 0, target = 0, spring = SPRINGS.release;
  let onBottom = null;

  function update(dt) {
    // Semi-implicit Euler, substepped for stability at low frame rates.
    const steps = 3, h = dt / steps;
    for (let i = 0; i < steps; i++) {
      vel += (-spring.k * (theta - target) - spring.c * vel) * h;
      theta += vel * h;
      if (theta > 1) { theta = 1; vel = -vel * 0.22; }       // end stop
      if (theta < -0.18) { theta = -0.18; vel = -vel * 0.3; }
    }
    if (onBottom && theta > 0.96) { const cb = onBottom; onBottom = null; cb(); }
    arm.rotation.x = REST + (PULLED - REST) * theta;
    return Math.abs(vel) > 0.002 || Math.abs(theta - target) > 0.002;
  }

  return {
    pivot, knob, hit,
    update,
    get theta() { return theta; },
    get busy() { return Math.abs(vel) > 0.002 || Math.abs(theta - target) > 0.002 || !!onBottom; },
    // Its own parts only: the hub and collar wear the cabinet's materials.
    dispose() { disposeAll([rod, knob, hit]); hub.geometry.dispose(); collar.geometry.dispose(); },
    drag(t) { spring = SPRINGS.drag; target = t; },
    release() { spring = SPRINGS.release; target = 0; },
    hint() { if (Math.abs(theta) < 0.01 && Math.abs(vel) < 0.01) { spring = SPRINGS.release; vel += 1.1; } },
    // Pull all the way down, resolve at the bottom, then spring back.
    pull(holdMs = 90) {
      spring = SPRINGS.auto; target = 1.08;
      return new Promise((resolve) => {
        onBottom = () => { resolve(); setTimeout(() => { spring = SPRINGS.release; target = 0; }, holdMs); };
      });
    },
    knobWorld(t, out = new THREE.Vector3()) {
      const saved = arm.rotation.x;
      arm.rotation.x = REST + (PULLED - REST) * t;
      arm.updateMatrixWorld(true);
      knob.getWorldPosition(out);
      arm.rotation.x = saved;
      arm.updateMatrixWorld(true);
      return out;
    },
  };
}
