import type { Phase } from "./bus";

export const TAU = Math.PI * 2;
export const FACES = 8;
export const REEL_OFFSET = Math.PI / FACES;

export type Reel = {
  angle: number;
  from: number;
  to: number;
  start: number;
  dur: number;
  active: boolean;
};

export type Rig = {
  reels: [Reel, Reel, Reel];
  phase: Phase;
  lever: number;
  leverPulling: boolean;
};

function makeReel(index: number): Reel {
  const angle = ((index * 3) % FACES) * (TAU / FACES);
  return { angle, from: angle, to: angle, start: 0, dur: 0, active: false };
}

export function createRig(): Rig {
  return {
    reels: [makeReel(0), makeReel(1), makeReel(2)],
    phase: "idle",
    lever: 0,
    leverPulling: false,
  };
}

export function beginSpin(rig: Rig, now: number, reduced: boolean) {
  if (rig.phase === "spinning") return false;

  for (let index = 0; index < 3; index += 1) {
    const reel = rig.reels[index];
    const stop = Math.floor(Math.random() * FACES);
    const stopAngle = (stop / FACES) * TAU;
    if (reduced) {
      reel.angle = stopAngle;
      reel.from = stopAngle;
      reel.to = stopAngle;
      reel.active = false;
      continue;
    }
    const extra = (4 + index * 2) * TAU;
    const base = reel.angle + extra;
    const wrapped = ((base % TAU) + TAU) % TAU;
    const delta = (stopAngle - wrapped + TAU) % TAU;
    reel.from = reel.angle;
    reel.to = base + delta;
    reel.start = now;
    reel.dur = 1100 + index * 520;
    reel.active = true;
  }

  rig.phase = reduced ? "landed" : "spinning";
  rig.leverPulling = !reduced;
  if (reduced) rig.lever = 0;
  return true;
}

export function stepRig(rig: Rig, now: number, reduced: boolean, dt: number) {
  if (reduced) {
    for (const reel of rig.reels) {
      if (!reel.active) continue;
      reel.angle = reel.to;
      reel.active = false;
    }
    rig.lever = 0;
    rig.leverPulling = false;
    if (rig.phase === "spinning") rig.phase = "landed";
    return false;
  }

  let moving = false;
  for (const reel of rig.reels) {
    if (!reel.active) continue;
    const t = Math.min(1, (now - reel.start) / reel.dur);
    const eased = 1 - (1 - t) ** 3;
    reel.angle = reel.from + (reel.to - reel.from) * eased;
    if (t >= 1) {
      reel.angle = reel.to;
      reel.active = false;
    } else {
      moving = true;
    }
  }

  if (rig.phase === "spinning" && rig.reels.every((reel) => !reel.active)) {
    rig.phase = "landed";
  }

  const target = rig.leverPulling ? 1 : 0;
  rig.lever += (target - rig.lever) * (1 - Math.exp(-8 * dt));
  if (rig.leverPulling && rig.lever > 0.92) rig.leverPulling = false;
  if (Math.abs(rig.lever - target) > 0.012) moving = true;
  else rig.lever = target;

  return moving;
}
