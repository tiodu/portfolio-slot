import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FACE, TAU, createMachine, dismiss, pull, tick } from "./machine";
import { pickOutcome } from "./outcome";
import { FACE_COUNT, reelSymbols } from "./symbol-list";

function wrapDelta(angle: number, target: number) {
  const delta = Math.abs(((angle - target) % TAU + TAU) % TAU);
  return Math.min(delta, TAU - delta);
}

function mixed(faces: [number, number, number]) {
  return { kind: "mixed" as const, faces };
}

function study() {
  return pickOutcome(() => 0);
}

describe("spin machine", () => {
  it("names the path idle, spinning, stopping, landed, idle", () => {
    const machine = createMachine();
    const seen = new Set<string>([machine.phase]);
    assert.equal(pull(machine, 0, mixed([1, 2, 3]), false), true);
    let now = 0;
    while (machine.phase !== "landed" && now < 8) {
      now += 1 / 60;
      tick(machine, now, 1 / 60, false);
      seen.add(machine.phase);
    }
    assert.equal(machine.phase, "landed");
    assert.deepEqual([...seen], ["idle", "spinning", "stopping", "landed"]);
    assert.equal(dismiss(machine), true);
    assert.equal(machine.phase, "idle");
  });

  it("ignores a pull unless it is idle", () => {
    const machine = createMachine();
    assert.equal(pull(machine, 0, mixed([0, 1, 2]), false), true);
    assert.equal(pull(machine, 0.1, mixed([3, 3, 3]), false), false);
    assert.notEqual(machine.outcome?.faces[0], 3);
  });

  it("stops the reels left to right on the chosen faces", () => {
    const machine = createMachine();
    const faces = [4, 0, 7] as [number, number, number];
    pull(machine, 0, mixed(faces), false);
    let now = 0;
    const stoppedAt = [-1, -1, -1];
    while (machine.phase !== "landed" && now < 8) {
      now += 1 / 120;
      tick(machine, now, 1 / 120, false);
      machine.reels.forEach((reel, index) => {
        if (reel.done && stoppedAt[index] < 0) stoppedAt[index] = now;
      });
    }
    assert.equal(machine.phase, "landed");
    assert.ok(stoppedAt[0] < stoppedAt[1]);
    assert.ok(stoppedAt[1] < stoppedAt[2]);
    faces.forEach((face, index) => {
      assert.ok(Math.abs(machine.reels[index].angle - face * FACE) < 1e-6);
    });
  });

  it("keeps the settle within the same symbol", () => {
    const machine = createMachine();
    pull(machine, 0, mixed([2, 5, 8]), false);
    let now = 0;
    while (machine.phase !== "landed" && now < 8) {
      now += 1 / 60;
      tick(machine, now, 1 / 60, false);
      machine.reels.forEach((reel, index) => {
        if (!reel.linearDone) return;
        const target = (machine.outcome?.faces[index] ?? 0) * FACE;
        const error = wrapDelta(reel.angle, target);
        assert.ok(error < FACE / 2, `reel ${index} left its symbol by ${error}`);
      });
    }
    assert.equal(machine.phase, "landed");
  });

  it("snaps when motion is reduced", () => {
    const machine = createMachine();
    const faces = [6, 6, 6] as [number, number, number];
    assert.equal(pull(machine, 1, mixed(faces), true), true);
    assert.equal(machine.phase, "landed");
    faces.forEach((face, index) => {
      assert.equal(machine.reels[index].angle, face * FACE);
    });
    assert.equal(tick(machine, 1.1, 1 / 60, true), false);
  });

  it("picks a case study or a mixed result, and lands on it", () => {
    const sequence = [0, 0.99, 0.2, 0.4, 0.6, 0.8];
    let cursor = 0;
    const random = () => sequence[cursor++] ?? 0.5;
    const first = pickOutcome(random);
    assert.equal(first.kind, "study");
    if (first.kind === "study") {
      assert.equal(first.faces[0], first.faces[1]);
      assert.equal(first.faces[1], first.faces[2]);
      assert.equal(reelSymbols[first.faces[0]]?.slug, first.slug);
      assert.ok(first.summary.length > 0);
    }
    const mixedResult = pickOutcome(random);
    assert.equal(mixedResult.kind, "mixed");
    const [a, b, c] = mixedResult.faces;
    const symbol = reelSymbols[a];
    assert.ok(!(a === b && b === c && symbol?.slug));
    assert.ok(mixedResult.faces.every((face) => face >= 0 && face < FACE_COUNT));
  });

  it("does not build a near-miss when the caller asked for a study", () => {
    const outcome = study();
    assert.equal(outcome.kind, "study");
    assert.equal(outcome.faces[0], outcome.faces[1]);
    assert.equal(outcome.faces[1], outcome.faces[2]);
  });
});
