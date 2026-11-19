import * as THREE from "three";
import { arch, frontZ } from "./metrics";

export function createArchGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-arch.rx, 0);
  shape.absellipse(0, 0, arch.rx, arch.ry, Math.PI, 0, true, 0);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: arch.depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.018,
    bevelSegments: 2,
    curveSegments: 28,
  });
  geometry.translate(0, 0, -arch.depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

class ArchCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private readonly rx: number,
    private readonly ry: number,
    private readonly y0: number,
    private readonly z: number,
  ) {
    super();
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    const angle = Math.PI * (1 - t);
    return optionalTarget.set(
      Math.cos(angle) * this.rx,
      this.y0 + Math.sin(angle) * this.ry,
      this.z,
    );
  }
}

export function createArchTrimGeometry() {
  const curve = new ArchCurve(
    arch.rx - 0.035,
    arch.ry - 0.015,
    arch.baseY + 0.02,
    frontZ + 0.03,
  );
  return new THREE.TubeGeometry(curve, 48, 0.018, 8, false);
}

export function createReelGeometry(radius: number, width: number) {
  const geometry = new THREE.CylinderGeometry(radius, radius, width, 40, 1, false);
  geometry.rotateZ(Math.PI / 2);
  return geometry;
}
