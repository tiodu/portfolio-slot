import { FACE_COUNT, idleFaces } from "./symbol-list";
import type { Outcome } from "./outcome";

export const TAU = Math.PI * 2;
export const FACE = TAU / FACE_COUNT;
/** Half a face, so the window centres the symbol. */
export const REEL_OFFSET = Math.PI / FACE_COUNT;

/**
 * States, in order:
 * idle — the lever and Space are accepted
 * spinning — all three reels turn at a steady speed
 * stopping — reels decelerate left to right, then settle
 * landed — the chosen result is showing
 * landed returns to idle when that result is dismissed
 */
export type Phase = "idle" | "spinning" | "stopping" | "landed";

const SPIN_SPEED = TAU * 2.15;
const SPIN_FOR = 0.72;
const MIN_STOP = 0.58;
const SETTLE_FOR = 0.24;
const OVERSHOOT = 0.12;

export type Reel = {
  angle: number;
  from: number;
  to: number;
  started: number;
  stopFor: number;
  stopping: boolean;
  linearDone: boolean;
  done: boolean;
};

export type Machine = {
  phase: Phase;
  outcome: Outcome | null;
  reels: [Reel, Reel, Reel];
  lever: number;
  leverDragging: boolean;
  leverHold: boolean;
  since: number;
};

function mod(value: number, wrap: number) {
  return ((value % wrap) + wrap) % wrap;
}

function makeReel(face: number): Reel {
  const angle = face * FACE;
  return {
    angle,
    from: angle,
    to: angle,
    started: 0,
    stopFor: 0,
    stopping: false,
    linearDone: true,
    done: true,
  };
}

export function createMachine(): Machine {
  return {
    phase: "idle",
    outcome: null,
    reels: [makeReel(idleFaces[0]), makeReel(idleFaces[1]), makeReel(idleFaces[2])],
    lever: 0,
    leverDragging: false,
    leverHold: false,
    since: 0,
  };
}

function faceAngle(face: number) {
  return face * FACE;
}

function beginStop(reel: Reel, face: number, now: number) {
  reel.stopping = true;
  reel.linearDone = false;
  reel.done = false;
  reel.from = reel.angle;
  reel.started = now;
  let delta = mod(faceAngle(face) - mod(reel.angle, TAU), TAU);
  const minDistance = (SPIN_SPEED * MIN_STOP) / 2;
  while (delta < minDistance) delta += TAU;
  reel.to = reel.angle + delta;
  reel.stopFor = (2 * delta) / SPIN_SPEED;
}

function snapToOutcome(machine: Machine) {
  const outcome = machine.outcome;
  if (!outcome) return;
  outcome.faces.forEach((face, index) => {
    const angle = faceAngle(face);
    const reel = machine.reels[index];
    reel.angle = angle;
    reel.from = angle;
    reel.to = angle;
    reel.stopping = false;
    reel.linearDone = true;
    reel.done = true;
  });
}

/** Start a spin. Ignored unless the machine is idle. */
export function pull(
  machine: Machine,
  now: number,
  outcome: Outcome,
  reduced: boolean,
): boolean {
  if (machine.phase !== "idle") return false;
  machine.outcome = outcome;
  machine.since = now;
  machine.leverDragging = false;
  if (reduced) {
    snapToOutcome(machine);
    machine.phase = "landed";
    machine.lever = 0;
    machine.leverHold = false;
    return true;
  }
  machine.phase = "spinning";
  machine.leverHold = true;
  for (const reel of machine.reels) {
    reel.stopping = false;
    reel.linearDone = false;
    reel.done = false;
  }
  return true;
}

export function dismiss(machine: Machine) {
  if (machine.phase !== "landed") return false;
  machine.phase = "idle";
  machine.leverHold = false;
  return true;
}

/** `amount` is 0 at rest and 1 fully pulled. `null` releases the drag. */
export function dragLever(machine: Machine, amount: number | null) {
  if (machine.phase !== "idle") {
    machine.leverDragging = false;
    return;
  }
  if (amount === null) {
    machine.leverDragging = false;
    return;
  }
  machine.leverDragging = true;
  machine.lever = Math.min(1, Math.max(0, amount));
}

function advanceStoppedReel(reel: Reel, now: number) {
  const elapsed = now - reel.started;
  if (elapsed <= reel.stopFor) {
    const u = elapsed / reel.stopFor;
    const covered = SPIN_SPEED * reel.stopFor * (u - (u * u) / 2);
    reel.angle = reel.from + covered;
    return;
  }
  reel.linearDone = true;
  const settleT = (elapsed - reel.stopFor) / SETTLE_FOR;
  if (settleT >= 1) {
    reel.angle = reel.to;
    reel.done = true;
    return;
  }
  reel.angle = reel.to + Math.sin(settleT * Math.PI) * OVERSHOOT;
}

function stepLever(machine: Machine, now: number, dt: number) {
  if (machine.leverDragging) return Math.abs(machine.lever) > 0.001;
  if (machine.leverHold && now - machine.since > 0.28) machine.leverHold = false;
  const target = machine.leverHold ? 1 : 0;
  const follow = 1 - Math.exp(-8 * dt);
  machine.lever += (target - machine.lever) * follow;
  if (Math.abs(machine.lever - target) < 0.012) machine.lever = target;
  return Math.abs(machine.lever - target) > 0;
}

/**
 * Advance the reels from the render loop. `dt` is seconds, so the motion
 * does not depend on the frame rate. Returns true while something is still moving.
 */
export function tick(
  machine: Machine,
  now: number,
  dt: number,
  reduced: boolean,
): boolean {
  const step = Math.min(Math.max(dt, 0), 0.05);

  if (reduced && (machine.phase === "spinning" || machine.phase === "stopping")) {
    snapToOutcome(machine);
    machine.phase = "landed";
    machine.lever = 0;
    machine.leverHold = false;
    return true;
  }

  if (machine.phase === "spinning" && now - machine.since >= SPIN_FOR) {
    machine.phase = "stopping";
    const face = machine.outcome?.faces[0] ?? 0;
    beginStop(machine.reels[0], face, now);
  }

  if (machine.phase === "spinning") {
    for (const reel of machine.reels) reel.angle += SPIN_SPEED * step;
  }

  if (machine.phase === "stopping" && machine.outcome) {
    for (let index = 0; index < 3; index += 1) {
      const reel = machine.reels[index];
      if (!reel.stopping) {
        const previous = machine.reels[index - 1];
        if (previous?.linearDone) {
          beginStop(reel, machine.outcome.faces[index], now);
          continue;
        }
        reel.angle += SPIN_SPEED * step;
        continue;
      }
      advanceStoppedReel(reel, now);
    }
    if (machine.reels.every((reel) => reel.done)) {
      machine.phase = "landed";
      snapToOutcome(machine);
    }
  }

  const leverMoving = stepLever(machine, now, step);
  return machine.phase === "spinning" || machine.phase === "stopping" || leverMoving;
}
