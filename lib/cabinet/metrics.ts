import spec from "./spec.json";

export const faces = spec.faces;

export const body = spec.body;
export const frontZ = body.depth / 2;
const bodyTop = body.y + body.height / 2;

export const burst = {
  outer: 0.74,
  inner: 0.46,
  points: 12,
  depth: 0.11,
  sx: 1.2,
  y: bodyTop + 0.56,
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

export const tray = {
  width: spec.drawer.width,
  height: spec.drawer.height,
  depth: spec.drawer.depth,
  y: body.y - body.height / 2 + spec.drawer.yOffset,
  z: spec.drawer.z,
};

export const badge = {
  y: tray.y + 0.34,
  z: frontZ + 0.14,
};

export const bulbs = spec.bulbs;

export const lever = {
  x: body.width / 2 + 0.16,
  y: 0.42,
  z: 0.12,
  arm: spec.lever.arm,
  knob: spec.lever.knob,
  rest: spec.lever.rest,
  pulled: spec.lever.pulled,
};

export const colors = spec.colors;

export const frame = {
  height: 4.55,
  width: 4.05,
  fov: 30,
  targetY: 0.42,
  yaw: 2.55,
};

export function bulbLayout() {
  const points = [];
  const steps = burst.points * 2;
  const floor = bodyTop - 0.04;
  const z = frontZ + 0.06;
  for (let index = 0; index < steps; index += 1) {
    const radius = index % 2 === 0 ? burst.outer + 0.015 : burst.inner + 0.02;
    const angle = -Math.PI / 2 + (index * Math.PI) / burst.points;
    const y = burst.y + Math.sin(angle) * radius;
    if (y < floor) continue;
    points.push({
      x: Math.cos(angle) * radius * burst.sx,
      y,
      z,
    });
  }
  return points;
}
