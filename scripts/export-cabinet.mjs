import { writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import spec from "../lib/spike/spec.json" with { type: "json" };

// GLTFExporter still finishes a binary file with FileReader. Node has Blob
// but not FileReader, so this stands in for that one call.
class FileReaderPolyfill {
  constructor() {
    this.onloadend = null;
    this.result = null;
  }

  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      if (this.onloadend) this.onloadend();
    });
  }
}

globalThis.FileReader = FileReaderPolyfill;

const body = spec.body;
const frontZ = body.depth / 2;
const arch = {
  width: body.width,
  height: spec.arch.height,
  depth: body.depth,
  baseY: body.y + body.height / 2 - 0.03,
  rx: body.width / 2,
  ry: spec.arch.height,
};
const plinth = {
  width: spec.plinth.width,
  height: spec.plinth.height,
  depth: spec.plinth.depth,
  y: body.y - body.height / 2 - spec.plinth.height / 2 + spec.plinth.overlap,
};
const drawer = {
  width: spec.drawer.width,
  height: spec.drawer.height,
  depth: spec.drawer.depth,
  y: body.y - body.height / 2 + spec.drawer.yOffset,
  z: spec.drawer.z,
};
const lever = {
  x: body.width / 2 + 0.12,
  y: 0.4,
  z: 0.06,
  arm: spec.lever.arm,
  knob: spec.lever.knob,
};
const neon = {
  y: arch.baseY + arch.height * 0.46,
  z: frontZ + 0.045,
};
const reel = spec.reel;
const frame = spec.window;
const colors = spec.colors;

function colorMaterial(kind) {
  if (kind === "red") {
    return new THREE.MeshPhysicalMaterial({
      color: colors.red,
      metalness: 0.2,
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.14,
    });
  }
  if (kind === "chrome") {
    return new THREE.MeshStandardMaterial({
      color: colors.chrome,
      metalness: 1,
      roughness: 0.16,
    });
  }
  if (kind === "drawer") {
    return new THREE.MeshStandardMaterial({
      color: colors.drawer,
      metalness: 0.92,
      roughness: 0.28,
    });
  }
  if (kind === "knob") {
    return new THREE.MeshPhysicalMaterial({
      color: colors.knob,
      metalness: 0.18,
      roughness: 0.32,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
    });
  }
  if (kind === "dark") {
    return new THREE.MeshStandardMaterial({
      color: colors.window,
      metalness: 0.08,
      roughness: 0.72,
    });
  }
  return new THREE.MeshStandardMaterial({ color: colors.reel, roughness: 0.5 });
}

function addMesh(parent, name, geometry, kind, position, rotation) {
  const mesh = new THREE.Mesh(geometry, colorMaterial(kind));
  mesh.name = name;
  if (position) mesh.position.set(position[0], position[1], position[2]);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  parent.add(mesh);
  return mesh;
}

function archGeometry() {
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
    curveSegments: 32,
  });
  geometry.translate(0, 0, -arch.depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

class ArchCurve extends THREE.Curve {
  constructor(rx, ry, y0, z) {
    super();
    this.rx = rx;
    this.ry = ry;
    this.y0 = y0;
    this.z = z;
  }

  getPoint(t, optionalTarget = new THREE.Vector3()) {
    const angle = Math.PI * (1 - t);
    return optionalTarget.set(
      Math.cos(angle) * this.rx,
      this.y0 + Math.sin(angle) * this.ry,
      this.z,
    );
  }
}

function trimGeometry(inset, radius) {
  const curve = new ArchCurve(
    arch.rx - inset,
    arch.ry - inset * 0.45,
    arch.baseY + 0.02,
    frontZ + 0.03,
  );
  return new THREE.TubeGeometry(curve, 56, radius, 8, false);
}

function reelGeometry() {
  const geometry = new THREE.CylinderGeometry(reel.radius, reel.radius, reel.width, 48, 1, false);
  geometry.rotateZ(Math.PI / 2);
  return geometry;
}

function bulbPoints() {
  const count = spec.bulbs.count;
  const points = [];
  const rx = arch.rx - 0.13;
  const ry = arch.ry - 0.07;
  const z = frontZ + spec.bulbs.radius * 0.85;
  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1);
    const angle = Math.PI * (1 - t);
    points.push({
      x: Math.cos(angle) * rx,
      y: arch.baseY + 0.04 + Math.sin(angle) * ry,
      z,
    });
  }
  return points;
}

const root = new THREE.Group();
root.name = "Cabinet";

addMesh(
  root,
  "Plinth",
  new RoundedBoxGeometry(plinth.width, plinth.height, plinth.depth, 3, 0.04),
  "red",
  [0, plinth.y, 0],
);
addMesh(
  root,
  "Body",
  new RoundedBoxGeometry(body.width, body.height, body.depth, 3, body.radius),
  "red",
  [0, body.y, 0],
);
addMesh(root, "Arch", archGeometry(), "red", [0, arch.baseY, 0]);
addMesh(root, "ArchTrim", trimGeometry(0.035, 0.018), "chrome");
addMesh(root, "InnerTrim", trimGeometry(0.11, 0.01), "chrome");

addMesh(
  root,
  "WindowBacking",
  new THREE.PlaneGeometry(frame.innerWidth, frame.innerHeight),
  "dark",
  [0, frame.y, frontZ + 0.012],
);

const outerWidth = frame.innerWidth + frame.bar * 2;
const outerHeight = frame.innerHeight + frame.bar * 2;
addMesh(
  root,
  "BezelTop",
  new RoundedBoxGeometry(outerWidth, frame.bar, frame.depth, 2, 0.02),
  "chrome",
  [0, frame.y + frame.innerHeight / 2 + frame.bar / 2, frame.z],
);
addMesh(
  root,
  "BezelBottom",
  new RoundedBoxGeometry(outerWidth, frame.bar, frame.depth, 2, 0.02),
  "chrome",
  [0, frame.y - frame.innerHeight / 2 - frame.bar / 2, frame.z],
);
addMesh(
  root,
  "BezelLeft",
  new RoundedBoxGeometry(frame.bar, outerHeight, frame.depth, 2, 0.02),
  "chrome",
  [-(frame.innerWidth / 2 + frame.bar / 2), frame.y, frame.z],
);
addMesh(
  root,
  "BezelRight",
  new RoundedBoxGeometry(frame.bar, outerHeight, frame.depth, 2, 0.02),
  "chrome",
  [frame.innerWidth / 2 + frame.bar / 2, frame.y, frame.z],
);

const span = reel.width + reel.gap;
const reelGeo = reelGeometry();
for (let index = 0; index < 3; index += 1) {
  addMesh(root, `Reel${index}`, reelGeo, "reel", [(index - 1) * span, reel.y, reel.z]);
}
for (const side of [-1, 1]) {
  addMesh(
    root,
    side < 0 ? "Divider0" : "Divider1",
    new RoundedBoxGeometry(0.05, frame.innerHeight, frame.depth, 2, 0.012),
    "chrome",
    [side * (span / 2), frame.y, frame.z + 0.02],
  );
}

addMesh(
  root,
  "Glass",
  new THREE.PlaneGeometry(frame.innerWidth, frame.innerHeight),
  "dark",
  [0, frame.y, reel.z + reel.radius + 0.06],
);

addMesh(
  root,
  "DrawerMouth",
  new THREE.BoxGeometry(drawer.width * 0.92, 0.045, 0.08),
  "dark",
  [0, drawer.y + drawer.height / 2 + 0.045, frontZ + 0.02],
);
addMesh(
  root,
  "Drawer",
  new RoundedBoxGeometry(drawer.width, drawer.height, drawer.depth, 2, 0.03),
  "drawer",
  [0, drawer.y, drawer.z],
);
addMesh(
  root,
  "DrawerHandle",
  new THREE.CylinderGeometry(0.016, 0.016, drawer.width * 0.42, 12),
  "chrome",
  [0, drawer.y, drawer.z + drawer.depth / 2 + 0.02],
  [0, 0, Math.PI / 2],
);
addMesh(
  root,
  "LeverPlate",
  new RoundedBoxGeometry(0.07, 0.78, 0.38, 2, 0.02),
  "chrome",
  [body.width / 2 + 0.02, 0.22, 0.02],
);

const pivot = new THREE.Group();
pivot.name = "LeverPivot";
pivot.position.set(lever.x, lever.y, lever.z);
root.add(pivot);
addMesh(
  pivot,
  "LeverCollar",
  new THREE.CylinderGeometry(0.07, 0.07, 0.08, 16),
  "chrome",
  [0, 0, 0],
  [0, 0, Math.PI / 2],
);
addMesh(
  pivot,
  "LeverArm",
  new THREE.CylinderGeometry(0.032, 0.038, lever.arm, 16),
  "chrome",
  [0, -lever.arm / 2, 0],
);
addMesh(
  pivot,
  "LeverKnob",
  new THREE.SphereGeometry(lever.knob, 24, 16),
  "knob",
  [0, -lever.arm, 0],
);

const bulbGeo = new THREE.SphereGeometry(spec.bulbs.radius, 16, 12);
const socketGeo = new THREE.SphereGeometry(spec.bulbs.radius * 1.28, 12, 8);
bulbPoints().forEach((point, index) => {
  const label = String(index).padStart(2, "0");
  addMesh(root, `Socket${label}`, socketGeo, "dark", [point.x, point.y, point.z - 0.02]);
  addMesh(root, `Bulb${label}`, bulbGeo, "knob", [point.x, point.y, point.z]);
});

const screwGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.02, 8);
const screwSpots = [
  [-outerWidth / 2 + 0.08, frame.y + outerHeight / 2 - 0.04, frame.z + 0.04],
  [outerWidth / 2 - 0.08, frame.y + outerHeight / 2 - 0.04, frame.z + 0.04],
  [-outerWidth / 2 + 0.08, frame.y - outerHeight / 2 + 0.04, frame.z + 0.04],
  [outerWidth / 2 - 0.08, frame.y - outerHeight / 2 + 0.04, frame.z + 0.04],
  [0, frame.y + outerHeight / 2 - 0.04, frame.z + 0.04],
  [0, frame.y - outerHeight / 2 + 0.04, frame.z + 0.04],
];
screwSpots.forEach((spot, index) => {
  addMesh(root, `Screw${String(index).padStart(2, "0")}`, screwGeo, "chrome", spot, [Math.PI / 2, 0, 0]);
});

const anchor = new THREE.Object3D();
anchor.name = "TopperAnchor";
anchor.position.set(0, neon.y, neon.z);
root.add(anchor);

const exporter = new GLTFExporter();
const binary = await exporter.parseAsync(root, { binary: true });
const output = Buffer.from(binary);
const target = new URL("../public/models/cabinet.glb", import.meta.url);
writeFileSync(target, output);

const loader = new GLTFLoader();
const loaded = await new Promise((resolve, reject) => {
  loader.parse(output.buffer, "", resolve, reject);
});
const names = [];
loaded.scene.traverse((object) => {
  if (object.name) names.push(object.name);
});

console.log(
  JSON.stringify(
    {
      bytes: output.byteLength,
      gzipBytes: gzipSync(output).byteLength,
      names: names.sort(),
    },
    null,
    2,
  ),
);
