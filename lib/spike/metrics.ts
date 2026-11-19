import spec from "./spec.json";

export const faces = spec.faces;

export const body = spec.body;
export const frontZ = body.depth / 2;

export const arch = {
  width: body.width,
  height: spec.arch.height,
  depth: body.depth,
  baseY: body.y + body.height / 2 - 0.03,
  rx: body.width / 2,
  ry: spec.arch.height,
};

export const plinth = {
  width: spec.plinth.width,
  height: spec.plinth.height,
  depth: spec.plinth.depth,
  y: body.y - body.height / 2 - spec.plinth.height / 2 + spec.plinth.overlap,
};

export const reel = spec.reel;

export function reelX(index: number) {
  return (index - 1) * (reel.width + reel.gap);
}

export const windowFrame = spec.window;

export const drawer = {
  width: spec.drawer.width,
  height: spec.drawer.height,
  depth: spec.drawer.depth,
  y: body.y - body.height / 2 + spec.drawer.yOffset,
  z: spec.drawer.z,
};

export const bulbs = spec.bulbs;

export const lever = {
  x: body.width / 2 + 0.12,
  y: 0.4,
  z: 0.06,
  arm: spec.lever.arm,
  knob: spec.lever.knob,
  rest: spec.lever.rest,
  pulled: spec.lever.pulled,
};

export const neon = {
  width: 1.46,
  height: 0.42,
  y: arch.baseY + arch.height * 0.46,
  z: frontZ + 0.045,
};

export const colors = spec.colors;

export const frame = {
  height: 3.45,
  width: 3.35,
  fov: 30,
  targetY: 0.04,
};

export function archPoint(
  t: number,
  rx: number,
  ry: number,
  y0: number,
  z: number,
) {
  const a = Math.PI * (1 - t);
  return {
    x: Math.cos(a) * rx,
    y: y0 + Math.sin(a) * ry,
    z,
  };
}

export function bulbLayout() {
  const count = bulbs.count;
  const points = [];
  const rx = arch.rx - 0.13;
  const ry = arch.ry - 0.07;
  const z = frontZ + bulbs.radius * 0.85;
  for (let index = 0; index < count; index += 1) {
    const t = count === 1 ? 0.5 : index / (count - 1);
    points.push(archPoint(t, rx, ry, arch.baseY + 0.04, z));
  }
  return points;
}
