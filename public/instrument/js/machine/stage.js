/*
 * Concept: one camera, one number.
 * The whole home to case study move is driven by a single value, `blend`:
 * 0 is the machine framed on the home page, 1 is the camera nose to nose
 * with the middle reel. Every frame the camera, the machine's turn, the
 * glass and the payline are all derived from blend. Tweening one number
 * is easy to interrupt: start the next tween from wherever blend is now.
 *
 * Distance is interpolated in log space, so the dolly reads as a steady
 * push at every scale instead of rushing at the start.
 *
 * Concept: subscribe, do not copy.
 * The stage listens for "themechange" instead of keeping the colours it
 * read at start-up. When the machine is idle it loads the new theme's
 * assets, throws the old cabinet, reels and lever away (dispose), reads
 * the colours again and builds new ones from the theme's cabinet spec,
 * carrying the reels' positions and the lit indicator across.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildCabinet, CORE } from './cabinet.js';
import { createReels } from './reels.js';
import { createLever } from './lever.js';
import { readColors, cellTextures, blurStrip } from './textures.js';
import { ensureThemeAssets } from './assets.js';
import { themes, currentTheme } from '../themes.js';
import { addTick, tween, lerp, clamp, smoothstep, animate } from '../motion.js';
import { dur, easeFn } from '../tokens.js';

const FOV = 26;
const HOME_YAW = -0.3;    // three-quarter view, lever side towards you

/* canRebuild: the app can hold a theme rebuild back (say, while a landed
   case study is about to open). The stage also waits for its own idle. */
export async function createStage({ mount, slot, studies, onLeverPull, onReelStop, canRebuild = () => true }) {
  let theme = themes[currentTheme()];
  await ensureThemeAssets(theme);
  let colors = readColors();
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(colors.paper, 1);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  mount.appendChild(canvas);

  const scene = new THREE.Scene();
  // Procedural studio: a room environment for reflections, then a key and a rim.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 1.05;
  pmrem.dispose();
  const key = new THREE.DirectionalLight('#fff6ec', 1.5);
  key.position.set(-4, 6, 7);
  const rim = new THREE.DirectionalLight('#e9f0ff', 2.6);
  rim.position.set(5, 4, -6);
  scene.add(key, rim, new THREE.AmbientLight('#ffffff', 0.15));

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 80);

  // Build the object.
  const machine = new THREE.Group();
  scene.add(machine);
  if (studies.length * 2 !== CORE.cells) {
    throw new Error(`The reels have ${CORE.cells} cells (each study twice), so they show ${CORE.cells / 2} studies, not ${studies.length}.`);
  }
  let cabinet, cells, reels, lever;
  // One cabinet from the theme's spec, with the core's reels and lever on it.
  function assemble() {
    cabinet = buildCabinet(renderer, theme.cabinet, colors, studies.length);
    machine.add(cabinet.group);
    cells = cellTextures(studies, renderer, colors, CORE.reelW / CORE.cellArc);
    reels = createReels({
      textures: cells.textures,
      blur: blurStrip(cells.canvases, renderer, CORE.cells),
      colors,
      onStop: (i) => { kickVel += 0.12; onReelStop?.(i); },
    });
    cabinet.group.add(reels.root);
    lever = createLever({ materials: cabinet.materials, accent: cabinet.knobColor, spec: theme.cabinet?.lever });
    cabinet.group.add(lever.pivot);
    // Upload every texture now, so the first spin never stalls on the GPU.
    renderer.compile(scene, camera);
    cells.textures.forEach((t) => renderer.initTexture(t));
  }
  assemble();
  reels.show([3, 0, 1]);
  let study = 0;                       // the study on the middle reel, for framing

  // ------------------------------------------------------------------ view
  const view = {
    blend: 0,          // 0 home framing, 1 inside the middle reel
    centred: 0,        // 0 framed in the hero slot, 1 centred in the viewport
    yaw: 0, pitch: 0,  // pointer drift, smoothed
  };
  const pointer = { x: 0, y: 0 };
  let kick = 0, kickVel = 0;   // a small thunk when the lever bottoms out
  let size = { w: 1, h: 1 };
  let slotRect = null;
  let dirty = true;

  function measure() {
    size = { w: mount.clientWidth || innerWidth, h: mount.clientHeight || innerHeight };
    renderer.setSize(size.w, size.h, false);
    camera.aspect = size.w / size.h;
    const r = slot?.getBoundingClientRect();
    if (r && r.width > 0) {
      // Store the slot at scroll 0: the machine is fixed, the page scrolls over it.
      slotRect = { left: r.left, top: r.top + scrollY, width: r.width, height: r.height };
    }
    dirty = true;
  }

  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpDir = new THREE.Vector3();

  function homePose(centred) {
    const s = slotRect && !centred
      ? slotRect
      : { left: size.w * 0.08, top: size.h * 0.1, width: size.w * 0.84, height: size.h * 0.8 };
    const f = cabinet.frame;           // each theme is framed to its own envelope
    const dH = f.h / (2 * tanHalf * (s.height * 0.94 / size.h));
    const dW = f.w / (2 * tanHalf * camera.aspect * (s.width * 0.96 / size.w));
    return {
      target: tmpA.set(f.cx, f.cy, 0),
      dist: Math.max(dH, dW),
      offX: size.w / 2 - (s.left + s.width / 2),
      offY: size.h / 2 - (s.top + s.height / 2),
    };
  }

  // Close enough that the reel face covers the screen, but never so close
  // that the numeral crops (that happens first in portrait).
  function insidePose() {
    const box = cells.boxes[study];
    const numW = box.w * CORE.reelW, numH = box.h * CORE.cellArc;
    const cover = Math.min(CORE.cellArc / (2 * tanHalf), CORE.reelW / (2 * tanHalf * camera.aspect)) * 0.98;
    const fit = Math.max(numH / (2 * tanHalf * 0.86), numW / (2 * tanHalf * camera.aspect * 0.86));
    const faceY = CORE.winY + CORE.cellArc * (0.5 - (box.y + box.h / 2));
    return { target: tmpB.set(0, faceY, CORE.reelFront), dist: Math.max(cover, fit) };
  }

  function applyCamera() {
    const b = view.blend;
    const home = homePose(false);
    const homeTarget = home.target.clone();
    const homeDist = home.dist, offX0 = home.offX, offY0 = home.offY;
    const c = homePose(true);
    // Mix the hero framing with the centred framing used between case studies.
    const startTarget = homeTarget.lerp(c.target, view.centred);
    const startDist = lerp(homeDist, c.dist, view.centred);
    const offX = lerp(offX0, c.offX, view.centred) * (1 - smoothstep(0, 0.85, b));
    const offY = lerp(offY0, c.offY, view.centred) * (1 - smoothstep(0, 0.85, b));
    const ins = insidePose();

    machine.rotation.y = HOME_YAW * (1 - smoothstep(0, 0.8, b)) + view.yaw * 0.6 * (1 - b);
    machine.position.y = -kick;
    const dist = Math.exp(lerp(Math.log(startDist), Math.log(ins.dist), b));
    const target = startTarget.lerp(ins.target, smoothstep(0, 1, b));
    const lift = 0.07 * (1 - b) + view.pitch * 0.05 * (1 - b);
    tmpDir.set(0, lift, 1).normalize();
    camera.position.copy(target).addScaledVector(tmpDir, dist);
    camera.lookAt(target);
    camera.setViewOffset(size.w, size.h, offX, offY, size.w, size.h);
    camera.updateProjectionMatrix();

    // Glass, payline and shading leave as the camera passes through them.
    const through = 1 - smoothstep(0.55, 0.9, b);
    cabinet.glass.material.opacity = 0.12 * through;
    cabinet.payline.material.opacity = through;
    cabinet.shades.forEach((m) => { m.visible = through > 0.01; m.material.opacity = through; });
    cabinet.sweep.visible = through > 0.01;
  }

  // ----------------------------------------------------------- interaction
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let drag = null;
  let leverUsed = false;
  let lastInput = performance.now();

  function hitLever(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects([lever.hit, lever.knob], false).length > 0;
  }

  function screenY(v) {
    const p = v.clone().project(camera);
    return (-p.y * 0.5 + 0.5) * size.h;
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (view.blend > 0.05 || swapping || !hitLever(e)) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, y0: screenY(lever.knobWorld(0)), y1: screenY(lever.knobWorld(1)), startY: e.clientY, fired: false, t: performance.now() };
    leverUsed = true;
  });
  canvas.addEventListener('pointermove', (e) => {
    lastInput = performance.now();
    if (!drag) {
      if (e.pointerType === 'mouse' && view.blend < 0.05) canvas.style.cursor = hitLever(e) ? 'grab' : '';
      return;
    }
    const t = clamp((e.clientY - drag.y0) / (drag.y1 - drag.y0), 0, 1.04);
    lever.drag(t);
    canvas.style.cursor = 'grabbing';
    if (!drag.fired && t > 0.88) { drag.fired = true; onLeverPull?.({ manual: true }); }
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const tap = Math.abs(e.clientY - drag.startY) < 8 && performance.now() - drag.t < 400;
    const fired = drag.fired;
    drag = null;
    canvas.style.cursor = '';
    lever.release();
    if (tap && !fired) onLeverPull?.({ manual: false });   // a click or tap pulls it for you
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  // Touch: stop the page scrolling only when the touch starts on the lever.
  canvas.addEventListener('touchstart', (e) => { if (view.blend < 0.05 && hitLever(e.touches[0])) e.preventDefault(); }, { passive: false });

  addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  // ----------------------------------------------------------------- loop
  let active = false;
  let stopTick = null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let clock = 0, nextSweep = dur.sweepEvery * 0.4, nextNudge = dur.nudgeEvery, nextHint = dur.hintEvery * 0.6;
  let sweepT = -1;

  function tick(dt) {
    clock += dt * 1000;
    let moving = false;
    const idle = view.blend < 0.001 && !reels.busy && !drag;

    // Pointer drift, smoothed. Settles to zero during transitions.
    const ty = idle ? pointer.x * 0.1 + Math.sin(clock / 4000) * 0.012 : 0;
    const tp = idle ? -pointer.y : 0;
    const k = 1 - Math.exp(-dt * 3);
    const dy = (ty - view.yaw) * k, dp = (tp - view.pitch) * k;
    view.yaw += dy; view.pitch += dp;
    if (Math.abs(dy) + Math.abs(dp) > 1e-5) moving = true;

    // The thunk: a spring on the machine's height.
    // Substepped, or a slow frame makes a stiff spring explode.
    for (let i = 0, h = dt / 6; i < 6; i++) {
      kickVel += (-600 * kick - 30 * kickVel) * h;
      kick += kickVel * h;
    }
    if (Math.abs(kick) > 1e-5 || Math.abs(kickVel) > 1e-4) moving = true;

    if (reels.update(dt)) moving = true;
    if (lever.update(dt)) moving = true;
    // The cabinet's own life (a bulb chase, say). Only redraws when it changes.
    if (cabinet.tick(dt, !reducedMotion.matches, lever.theta)) moving = true;

    // Idle life: light across the glass, a shuffle, a nudge at the lever.
    if (idle) {
      if (clock > nextSweep && sweepT < 0) { sweepT = 0; nextSweep = clock + dur.sweepEvery; }
      if (clock > nextNudge) { reels.nudge(); nextNudge = clock + dur.nudgeEvery; }
      if (!leverUsed && clock > nextHint && performance.now() - lastInput > 1500) { lever.hint(); nextHint = clock + dur.hintEvery; }
    }
    if (sweepT >= 0) {
      sweepT += (dt * 1000) / dur.sweep;
      const p = Math.min(1, sweepT);
      cabinet.sweep.material.map.offset.x = lerp(0.75, -0.75, easeFn.standard(p));
      cabinet.sweep.material.opacity = Math.sin(p * Math.PI) * 0.6;
      if (p >= 1) { sweepT = -1; cabinet.sweep.material.opacity = 0; }
      moving = true;
    }

    if (moving || dirty) {
      applyCamera();
      renderer.render(scene, camera);
      dirty = false;
    }
    trySwap();
  }

  function setActive(on) {
    if (on === active) return;
    active = on;
    if (on) { dirty = true; stopTick = addTick(tick); } else { stopTick?.(); stopTick = null; }
  }

  const ro = new ResizeObserver(() => { measure(); if (!active) { applyCamera(); renderer.render(scene, camera); } });
  ro.observe(mount);
  if (slot) ro.observe(slot);
  measure();
  applyCamera();
  renderer.render(scene, camera);

  async function spinNow(target, { signal, manual, onSpin, onSettle }) {
    cabinet.setLed(-1);
    if (!manual) await lever.pull(dur.leverHold);
    if (signal?.aborted) return false;
    kickVel += 0.45;
    onSpin?.();
    let settled = false;
    study = target;
    const done = reels.spin(target);
    const onAbort = () => reels.snap(target);
    signal?.addEventListener('abort', onAbort, { once: true });
    const off = addTick(() => { if (!settled && reels.firstStopped()) { settled = true; onSettle?.(); } });
    const ok = await done;
    off();
    signal?.removeEventListener('abort', onAbort);
    if (ok) cabinet.setLed(target);
    return ok && !signal?.aborted;
  }

  // ------------------------------------------------------------ public API
  function tweenView(prop, to, duration, easing, signal) {
    const from = view[prop];
    if (Math.abs(from - to) < 1e-4) { view[prop] = to; return Promise.resolve(true); }
    // Shorter if we are already part of the way there (interrupted).
    const d = duration * Math.max(0.35, Math.abs(to - from));
    dirty = true;
    tweening++;
    return tween(d, easing, (e) => { view[prop] = lerp(from, to, e); dirty = true; }, signal)
      .finally(() => { tweening--; trySwap(); });
  }

  // ---------------------------------------------------------- live theme
  let pending = null;      // the newest theme asked for: the latest one wins
  let swapping = null;     // the rebuild in flight
  let pulling = false;     // inside pullAndSpin
  let tweening = 0;        // camera tweens running
  const waiters = [];

  // Home view, reels not spinning, no camera move, nobody on the lever.
  const idle = () => view.blend < 0.001 && !pulling && tweening === 0 && !drag
    && !reels.busy && !lever.busy && canRebuild();

  function onThemeChange(e) {
    pending = e.detail.theme;
    trySwap();
  }
  document.addEventListener('themechange', onThemeChange);

  function trySwap() {
    if (pending && !swapping && idle()) {
      const next = pending;
      pending = null;
      swapping = swap(next).finally(() => { swapping = null; trySwap(); });
    }
    if (!pending && !swapping) waiters.splice(0).forEach((resolve) => resolve());
  }

  async function swap(next) {
    if (next.name === theme.name) return;
    await ensureThemeAssets(next);
    // A short canvas fade hides the rebuild. Reduced motion: an instant swap.
    const fade = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (fade) await animate(canvas, [{ opacity: 1 }, { opacity: 0 }], { duration: dur.canvasFade / 2, easing: 'ease-out', fill: 'forwards' });

    const keep = { angles: reels.pose(), led: cabinet.led };
    machine.remove(cabinet.group);
    lever.dispose();
    reels.dispose();
    cabinet.dispose();

    theme = next;
    colors = readColors();
    renderer.setClearColor(colors.paper, 1);
    assemble();
    reels.restore(keep.angles);
    cabinet.setLed(keep.led);
    applyCamera();
    renderer.render(scene, camera);
    dirty = true;

    if (fade) await animate(canvas, [{ opacity: 0 }, { opacity: 1 }], { duration: dur.canvasFade / 2, easing: 'ease-in' });
    canvas.getAnimations().forEach((a) => a.cancel());
  }

  return {
    canvas,
    setActive,
    get blend() { return view.blend; },
    get theme() { return theme.name; },
    get fits() { return cabinet.fits; },
    setLed: (i) => { cabinet.setLed(i); dirty = true; },

    // Resolves once no theme switch is waiting or rebuilding.
    settled() { return new Promise((resolve) => { waiters.push(resolve); trySwap(); }); },

    // What the GPU holds, for the dev panel's leak test.
    stats() {
      const { render, memory, programs } = renderer.info;
      return { calls: render.calls, triangles: render.triangles, geometries: memory.geometries, textures: memory.textures, programs: programs?.length ?? 0 };
    },

    async pullAndSpin(target, { signal, manual, onSpin, onSettle } = {}) {
      setActive(true);
      pulling = true;
      try {
        if (swapping) await swapping;       // never spin a cabinet that is being thrown away
        return await spinNow(target, { signal, manual, onSpin, onSettle });
      } finally {
        pulling = false;
        trySwap();
      }
    },

    pushIn(signal) {
      setActive(true);
      return tweenView('blend', 1, dur.dolly, easeFn.push, signal);
    },


    async pullOut(signal, { centred = false } = {}) {
      setActive(true);
      const a = tweenView('blend', 0, dur.pullBack, easeFn.pull, signal);
      const b = tweenView('centred', centred ? 1 : 0, dur.pullBack, easeFn.pull, signal);
      const [ra, rb] = await Promise.all([a, b]);
      return ra && rb;
    },

    // Jump without animation: used on direct loads and before collapses.
    jump({ blend, centred, study: s }) {
      if (blend !== undefined) view.blend = blend;
      if (centred !== undefined) view.centred = centred;
      if (s !== undefined) { study = s; reels.show([s, s, s]); cabinet.setLed(s); }
      applyCamera();
      renderer.render(scene, camera);
    },

    // Screen rectangle of the middle reel's numeral: the shared element.
    heroRect() {
      applyCamera();
      machine.updateMatrixWorld(true);
      camera.updateMatrixWorld();      // project() reads matrixWorldInverse
      const b = cells.boxes[study];
      const R = CORE.R;
      // Top-left and bottom-right of the numeral's line box, on the curved face.
      const a0 = (0.5 - b.y) * CORE.cellArc / R, a1 = (0.5 - b.y - b.h) * CORE.cellArc / R;
      const pts = [
        [-CORE.reelW / 2 + b.x * CORE.reelW, a0], [-CORE.reelW / 2 + (b.x + b.w) * CORE.reelW, a1],
      ].map(([x, a]) => {
        const v = new THREE.Vector3(x, CORE.winY + R * Math.sin(a), CORE.reelZ + R * Math.cos(a));
        cabinet.group.localToWorld(v);
        v.project(camera);
        return { x: (v.x * 0.5 + 0.5) * size.w, y: (-v.y * 0.5 + 0.5) * size.h };
      });
      return { left: pts[0].x, top: pts[0].y, width: pts[1].x - pts[0].x, height: pts[1].y - pts[0].y };
    },

    destroy() {
      setActive(false);
      document.removeEventListener('themechange', onThemeChange);
      ro.disconnect();
      scene.traverse((o) => {
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => { Object.values(m).forEach((v) => v?.isTexture && v.dispose()); m.dispose(); });
      });
      envRT.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
