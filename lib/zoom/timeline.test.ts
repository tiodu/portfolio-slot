import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PAGE_START_T,
  ZOOM_MS,
  ZOOM_OVERSHOOT,
  ZOOM_ROLL_DEG,
  progressAt,
  zoomFrame,
} from "./timeline";

const samples = Array.from({ length: 101 }, (_, index) => index / 100);

describe("zoom timeline", () => {
  it("is at rest at t = 0 and fully done at t = 1", () => {
    assert.deepEqual(zoomFrame(0), { dolly: 0, rollDeg: 0, dim: 0, page: 0 });
    const end = zoomFrame(1);
    assert.equal(end.dim, 1);
    assert.equal(end.page, 1);
    assert.equal(end.rollDeg, ZOOM_ROLL_DEG);
    assert.equal(end.dolly, ZOOM_OVERSHOOT);
  });

  it("clamps outside 0 to 1, so skip (t = 1) is the final frame", () => {
    assert.deepEqual(zoomFrame(-0.5), zoomFrame(0));
    assert.deepEqual(zoomFrame(7), zoomFrame(1));
  });

  it("keeps each channel inside its own window", () => {
    const at = (ms: number) => zoomFrame(ms / ZOOM_MS);
    assert.equal(at(80).dolly, 0);
    assert.ok(at(81).dolly > 0);
    assert.equal(at(620).dolly, ZOOM_OVERSHOOT);
    assert.equal(at(420).dim, 0);
    assert.ok(at(421).dim > 0);
    assert.equal(at(700).dim, 1);
    assert.equal(at(680).page, 0);
    assert.ok(at(681).page > 0);
  });

  it("only ever moves forwards on every channel", () => {
    let previous = zoomFrame(0);
    for (const t of samples) {
      const frame = zoomFrame(t);
      assert.ok(frame.dolly >= previous.dolly);
      assert.ok(frame.rollDeg >= previous.rollDeg);
      assert.ok(frame.dim >= previous.dim);
      assert.ok(frame.page >= previous.page);
      previous = frame;
    }
  });

  it("is pure: same t gives the same frame, in any order, and no shared state", () => {
    const first = samples.map(zoomFrame);
    const shuffled = [...samples].reverse().map(zoomFrame).reverse();
    assert.deepEqual(first, shuffled);
    const a = zoomFrame(0.5);
    const b = zoomFrame(0.5);
    assert.notEqual(a, b);
    a.dim = 99;
    assert.equal(zoomFrame(0.5).dim, b.dim);
  });

  it("starts the dim before the page and has it nearly dark when the page appears", () => {
    for (const t of samples) {
      const frame = zoomFrame(t);
      if (frame.page > 0) assert.ok(frame.dim > 0.98, `dim at t=${t}`);
      if (frame.dim === 0) assert.equal(frame.page, 0);
    }
    assert.ok(zoomFrame(PAGE_START_T).dim > 0.98);
  });

  it("runs the camera before the dim and finishes it before the page starts", () => {
    assert.equal(zoomFrame(400 / ZOOM_MS).dim, 0);
    assert.equal(zoomFrame(PAGE_START_T).dolly, ZOOM_OVERSHOOT);
  });

  it("maps elapsed time to progress for forwards and reverse", () => {
    assert.equal(progressAt(0, 1), 0);
    assert.equal(progressAt(ZOOM_MS, 1), 1);
    assert.equal(progressAt(ZOOM_MS * 2, 1), 1);
    assert.equal(progressAt(0, -1), 1);
    assert.equal(progressAt(ZOOM_MS, -1), 0);
    assert.equal(progressAt(ZOOM_MS / 4, -1), 0.75);
  });
});
