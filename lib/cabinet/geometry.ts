import * as THREE from "three";
import { burst } from "./metrics";

function starShape(outer: number, inner: number, sx: number) {
  const shape = new THREE.Shape();
  const steps = burst.points * 2;
  for (let index = 0; index < steps; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / burst.points;
    const x = Math.cos(angle) * radius * sx;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export function createStarburstGeometry(outer: number, inner: number, depth: number) {
  const geometry = new THREE.ExtrudeGeometry(starShape(outer, inner, burst.sx), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.016,
    bevelSegments: 2,
    curveSegments: 1,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

export function createWingGeometry(direction: 1 | -1) {
  const shape = new THREE.Shape();
  const dir = direction;
  shape.moveTo(0.02 * dir, 0.07);
  shape.lineTo(0.46 * dir, 0.12);
  shape.lineTo(0.58 * dir, 0.01);
  shape.lineTo(0.4 * dir, -0.08);
  shape.lineTo(0.02 * dir, -0.04);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  geometry.translate(0, 0, -0.025);
  geometry.computeVertexNormals();
  return geometry;
}

export function createFanGeometry() {
  const shape = new THREE.Shape();
  const radius = 0.26;
  const start = -Math.PI * 0.08;
  const end = Math.PI * 0.62;
  shape.moveTo(0.04, 0);
  shape.absarc(0, 0, radius, start, end, false);
  shape.lineTo(0.02, 0.02);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 1,
    curveSegments: 10,
  });
  geometry.translate(0, 0, -0.015);
  geometry.computeVertexNormals();
  return geometry;
}

export function createArrowGeometry() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.48, -0.2, 0),
    new THREE.Vector3(0.08, -0.28, 0),
    new THREE.Vector3(0.28, -0.4, 0.01),
    new THREE.Vector3(0.06, -0.58, 0.02),
  ]);
  return new THREE.TubeGeometry(curve, 40, 0.012, 8, false);
}

export function createReelGeometry(radius: number, width: number) {
  const geometry = new THREE.CylinderGeometry(radius, radius, width, 40, 1, false);
  geometry.rotateZ(Math.PI / 2);
  return geometry;
}
