/*
 * Concept: build a designed object from a few honest parts.
 * A graphite body, a brushed aluminium fascia with the window cut out
 * (an extruded shape with a hole, so the window has real depth), glass,
 * printed graphics and a fake contact shadow. All sizes come from DIM,
 * so the reels, the camera and the DOM hero can share the same numbers.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { brushed, decal, radial, verticalFade, sweepBand } from './textures.js';

export const DIM = (() => {
  const W = 3.0, H = 3.4, D = 1.6, FEET = 0.07;
  const plateDepth = 0.24, bevel = 0.02;
  const bodyFront = D / 2;
  const plateBack = bodyFront - 0.02;
  const plateFront = plateBack + plateDepth + bevel * 2;
  const R = 0.86, reelW = 0.8, gap = 0.1;
  const winW = reelW * 3 + gap * 2 + 0.12, winH = 1.1;
  const winY = FEET + H * 0.62;
  const reelFront = plateFront - 0.05;
  return {
    W, H, D, FEET, plateDepth, bevel, plateBack, plateFront,
    R, reelW, gap, winW, winH, winY, reelFront, reelZ: reelFront - R,
    cells: 8, cellArc: (2 * Math.PI * R) / 8,
    reelXs: [-(reelW + gap), 0, reelW + gap],
    leverY: FEET + H * 0.42, leverLength: 1.55,
    // Overall framing box, lever included.
    frame: { cx: 0.16, cy: 1.75, w: 3.7, h: 3.75 },
  };
})();

function roundedRect(shape, x, y, w, h, r) {
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

export function buildCabinet(renderer, colors) {
  const d = DIM;
  const group = new THREE.Group();

  // Materials: three surfaces only, so it reads as one designed object.
  const brush = brushed(renderer);
  brush.repeat.set(0.6, 0.6);
  const graphite = new THREE.MeshPhysicalMaterial({
    color: colors.graphite, roughness: 0.42, metalness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.32,
  });
  const aluminium = new THREE.MeshPhysicalMaterial({
    color: colors.alu, metalness: 1, roughness: 0.34, roughnessMap: brush,
    anisotropy: 0.7, anisotropyRotation: 0,
  });
  const rubber = new THREE.MeshStandardMaterial({ color: '#0d0d0e', roughness: 0.9 });

  // Body.
  const body = new THREE.Mesh(new RoundedBoxGeometry(d.W, d.H, d.D, 6, 0.14), graphite);
  body.position.y = d.FEET + d.H / 2;
  group.add(body);

  // Fascia with the window cut out. Front face aluminium, edges graphite.
  const inset = 0.06 + d.bevel;
  const outer = roundedRect(new THREE.Shape(), -d.W / 2 + inset, -d.H / 2 + inset, d.W - inset * 2, d.H - inset * 2, 0.1);
  const hole = roundedRect(new THREE.Path(), -d.winW / 2 - d.bevel, d.winY - body.position.y - d.winH / 2 - d.bevel,
    d.winW + d.bevel * 2, d.winH + d.bevel * 2, 0.05);
  outer.holes.push(hole);
  const plateGeo = new THREE.ExtrudeGeometry(outer, {
    depth: d.plateDepth, bevelEnabled: true, bevelThickness: d.bevel, bevelSize: d.bevel, bevelSegments: 4, curveSegments: 10,
  });
  const plate = new THREE.Mesh(plateGeo, [aluminium, graphite]);
  plate.position.set(0, body.position.y, d.plateBack + d.bevel);
  group.add(plate);

  // Printed graphics sit a hair in front of the fascia.
  const zPrint = d.plateFront + 0.0015;
  const printMat = (tex) => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });

  const nameplate = decal(2048, 220, (x, w, h) => {
    x.fillStyle = colors.ink;
    x.font = '500 64px "IBM Plex Mono", monospace';
    if ('letterSpacing' in x) x.letterSpacing = '10px';
    x.textBaseline = 'middle';
    x.fillText('EDUARDO DE SOUZA', 0, h * 0.42);
    x.textAlign = 'right';
    x.globalAlpha = 0.62;
    x.fillText('WORK SELECTOR / 4 STUDIES', w, h * 0.42);
    x.globalAlpha = 1;
    x.fillRect(0, h - 6, w, 4);
  }, renderer);
  const name = new THREE.Mesh(new THREE.PlaneGeometry(d.winW, d.winW * 220 / 2048), printMat(nameplate));
  name.position.set(0, d.winY + d.winH / 2 + 0.3, zPrint);
  group.add(name);

  // LED row: one light per case study, lit on the landed one.
  const ledY = d.winY - d.winH / 2 - 0.3;
  const ledXs = [-0.54, -0.18, 0.18, 0.54];
  const ledOff = new THREE.MeshStandardMaterial({ color: '#3a3836', roughness: 0.4 });
  const ledOn = new THREE.MeshStandardMaterial({ color: colors.accent, emissive: colors.accent, emissiveIntensity: 1.6, roughness: 0.3, toneMapped: false });
  const leds = ledXs.map((x) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.03, 20).rotateX(Math.PI / 2), ledOff);
    m.position.set(x, ledY, d.plateFront + 0.012);
    group.add(m);
    return m;
  });
  const ledLabels = decal(2048, 200, (x, w, h) => {
    x.fillStyle = colors.ink;
    x.font = '500 52px "IBM Plex Mono", monospace';
    x.textBaseline = 'middle';
    x.textAlign = 'center';
    ledXs.forEach((lx, i) => x.fillText(`0${i + 1}`, (lx / d.winW + 0.5) * w, h * 0.78));
    x.textAlign = 'left';
    x.globalAlpha = 0.62;
    x.fillText('CASE', 0, h * 0.3);
    x.textAlign = 'right';
    x.fillText('PULL LEVER', w, h * 0.3);
    x.globalAlpha = 1;
  }, renderer);
  const ledPrint = new THREE.Mesh(new THREE.PlaneGeometry(d.winW, d.winW * 200 / 2048), printMat(ledLabels));
  ledPrint.position.set(0, ledY - 0.04, zPrint);
  group.add(ledPrint);

  // Lower panel: a perforated grille and the small print that matters.
  const grille = decal(1024, 512, (x, w, h) => {
    x.fillStyle = colors.ink;
    const cols = 26, rows = 9, gx = w / cols;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      x.globalAlpha = 0.82;
      x.beginPath(); x.arc(gx * (c + 0.5), 40 + r * 36, 7, 0, Math.PI * 2); x.fill();
    }
    x.globalAlpha = 0.7;
    x.font = '500 34px "IBM Plex Mono", monospace';
    if ('letterSpacing' in x) x.letterSpacing = '5px';
    x.textBaseline = 'middle';
    x.fillText('A UI METAPHOR. NOT A CASINO.', 0, h - 92);
    x.fillText('NO REAL MONEY. NO ODDS.', 0, h - 40);
  }, renderer);
  const grilleMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), printMat(grille));
  grilleMesh.position.set(-d.winW / 2 + 0.75, d.FEET + 0.62, zPrint);
  group.add(grilleMesh);

  // Window interior: dark falloff top and bottom sells the curvature.
  const fade = verticalFade(renderer);
  const shadeMat = new THREE.MeshBasicMaterial({ color: '#000', alphaMap: fade, transparent: true, depthWrite: false });
  const shadeH = d.winH * 0.36;
  const shadeTop = new THREE.Mesh(new THREE.PlaneGeometry(d.winW, shadeH), shadeMat);
  shadeTop.position.set(0, d.winY + d.winH / 2 - shadeH / 2, d.reelFront + 0.015);
  const shadeBottom = shadeTop.clone();
  shadeBottom.rotation.z = Math.PI;
  shadeBottom.position.y = d.winY - d.winH / 2 + shadeH / 2;
  group.add(shadeTop, shadeBottom);

  // Payline: the one accent stroke on the machine.
  const accentFlat = new THREE.MeshBasicMaterial({ color: colors.accent, transparent: true, toneMapped: false });
  const payline = new THREE.Mesh(new THREE.PlaneGeometry(d.winW - 0.02, 0.012), accentFlat);
  payline.position.set(0, d.winY, d.reelFront + 0.02);
  group.add(payline);
  const tri = new THREE.Shape();
  tri.moveTo(0, 0.05); tri.lineTo(0.07, 0); tri.lineTo(0, -0.05); tri.closePath();
  const marks = [-1, 1].map((side) => {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(tri), accentFlat);
    m.position.set(side * (d.winW / 2 + 0.1), d.winY, zPrint);
    if (side > 0) m.rotation.z = Math.PI;
    group.add(m);
    return m;
  });

  // Glass, and a band of light that travels across it when idle.
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(d.winW + 0.04, d.winH + 0.04),
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.12, depthWrite: false, envMapIntensity: 2 })
  );
  glass.position.set(0, d.winY, d.plateFront - 0.03);
  group.add(glass);
  const sweepTex = sweepBand(renderer);
  const sweep = new THREE.Mesh(
    new THREE.PlaneGeometry(d.winW, d.winH),
    new THREE.MeshBasicMaterial({ map: sweepTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  sweep.position.set(0, d.winY, d.plateFront - 0.028);
  group.add(sweep);

  // Feet and contact shadow.
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, d.FEET, 24), rubber);
    f.position.set(x * (d.W / 2 - 0.3), d.FEET / 2, z * (d.D / 2 - 0.25));
    group.add(f);
  }
  const shadowSoft = new THREE.Mesh(new THREE.PlaneGeometry(d.W * 2.1, d.D * 2.6),
    new THREE.MeshBasicMaterial({ color: '#000', alphaMap: radial(renderer, 0.4), transparent: true, depthWrite: false }));
  shadowSoft.rotation.x = -Math.PI / 2;
  shadowSoft.position.y = 0.002;
  const shadowTight = new THREE.Mesh(new THREE.PlaneGeometry(d.W * 1.15, d.D * 1.3),
    new THREE.MeshBasicMaterial({ color: '#000', alphaMap: radial(renderer, 0.85), transparent: true, depthWrite: false }));
  shadowTight.rotation.x = -Math.PI / 2;
  shadowTight.position.y = 0.003;
  group.add(shadowSoft, shadowTight);

  // Lever mount on the right side.
  const mount = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.7, 0.7, 4, 0.05), graphite);
  mount.position.set(d.W / 2 + 0.06, d.leverY, 0);
  group.add(mount);

  return {
    group,
    materials: { graphite, aluminium },
    glass, sweep, payline, marks, shades: [shadeTop, shadeBottom],
    setLed(index) { leds.forEach((m, i) => { m.material = i === index ? ledOn : ledOff; }); },
  };
}
