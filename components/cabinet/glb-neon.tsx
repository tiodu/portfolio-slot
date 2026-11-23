"use client";

import { Text } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createNeonMaterial } from "@/lib/cabinet/materials";
import { colors } from "@/lib/cabinet/metrics";
import { ARROW_HEAD, ARROW_TUBE, neonPoint } from "@/lib/cabinet/neon-path";

const FONT = "/fonts/Damion-Regular.ttf";
/** Just in front of the teal panel, in metres. */
const Z = 0.205;
const GLASS = 0.0042;
const CORE = 0.0016;
/** The arrowhead is drawn heavier than the swoosh, like the reference. */
const HEAD = 1.45;

function point([x, y]: [number, number], z = Z) {
  return new THREE.Vector3(x, y, z);
}

/**
 * The neon sign in the star: "Eduardo" in pink, "de Souza" in cyan, and the swoosh and arrow.
 * Sizes are in metres, inside the scaled model group. The glass tube is the coloured body and a
 * thinner light core sits inside it, and the bloom does the glow.
 */
export function GlbNeon({ onTargets }: { onTargets: (objects: THREE.Object3D[]) => void }) {
  const pink = useRef<THREE.Object3D>(null);
  const cyan = useRef<THREE.Object3D>(null);
  const glass = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Group>(null);
  const reported = useRef(false);

  const { curve, barbs, tip } = useMemo(() => {
    const path = new THREE.CatmullRomCurve3(ARROW_TUBE.map((p) => point(neonPoint(p))), false, "centripetal");
    const [barbA, tipPoint, barbB] = ARROW_HEAD.map((p) => point(neonPoint(p)));
    return {
      curve: path,
      barbs: [new THREE.LineCurve3(tipPoint, barbA), new THREE.LineCurve3(tipPoint, barbB)],
      tip: tipPoint,
    };
  }, []);

  const resources = useMemo(() => {
    const radial = 8;
    const glassGeometry = new THREE.TubeGeometry(curve, 160, GLASS, radial, false);
    const coreGeometry = new THREE.TubeGeometry(curve, 160, CORE, radial, false);
    const barbGlass = barbs.map((barb) => new THREE.TubeGeometry(barb, 2, GLASS * HEAD, radial, false));
    const barbCore = barbs.map((barb) => new THREE.TubeGeometry(barb, 2, CORE * HEAD, radial, false));
    return {
      glassGeometry,
      coreGeometry,
      barbGlass,
      barbCore,
      joint: new THREE.SphereGeometry(GLASS * HEAD, 12, 8),
      jointCore: new THREE.SphereGeometry(CORE, 8, 6),
      glassMaterial: createNeonMaterial(colors.neonPink),
      coreMaterial: new THREE.MeshBasicMaterial({ color: "#fff0f7", toneMapped: false }),
    };
  }, [curve, barbs]);

  useEffect(() => {
    return () => {
      resources.glassGeometry.dispose();
      resources.coreGeometry.dispose();
      resources.barbGlass.forEach((g) => g.dispose());
      resources.barbCore.forEach((g) => g.dispose());
      resources.joint.dispose();
      resources.jointCore.dispose();
      resources.glassMaterial.dispose();
      resources.coreMaterial.dispose();
    };
  }, [resources]);

  const publish = () => {
    if (reported.current) return;
    const objects = [pink.current, cyan.current, glass.current, core.current, head.current].filter(
      (object): object is THREE.Object3D => object !== null,
    );
    if (objects.length < 5) return;
    reported.current = true;
    onTargets(objects);
  };

  const mark = (text: THREE.Object3D) => {
    const material = (text as THREE.Mesh).material;
    const list = Array.isArray(material) ? material : [material];
    list.forEach((entry) => {
      if (entry) entry.toneMapped = false;
    });
    publish();
  };

  return (
    <group>
      <Text
        ref={pink}
        font={FONT}
        characters="Eduardo de Souza"
        fontSize={0.108}
        color={colors.neonPink}
        anchorX="center"
        anchorY="middle"
        position={[-0.004, 0.545, Z]}
        rotation={[0, 0, 0.15]}
        outlineWidth="2.5%"
        outlineColor={colors.neonPink}
        outlineOpacity={0.9}
        outlineBlur="2.5%"
        onSync={mark}
      >
        Eduardo
      </Text>
      <Text
        ref={cyan}
        font={FONT}
        characters="Eduardo de Souza"
        fontSize={0.082}
        color={colors.neonCyan}
        anchorX="center"
        anchorY="middle"
        position={[0.012, 0.455, Z]}
        rotation={[0, 0, 0.1]}
        outlineWidth="2.5%"
        outlineColor={colors.neonCyan}
        outlineOpacity={0.85}
        outlineBlur="2.5%"
        onSync={mark}
      >
        de Souza
      </Text>
      <mesh ref={glass} geometry={resources.glassGeometry} material={resources.glassMaterial} />
      <mesh ref={core} geometry={resources.coreGeometry} material={resources.coreMaterial} position={[0, 0, 0.0012]} />
      <group ref={head}>
        {resources.barbGlass.map((geometry, index) => (
          <mesh key={`g${index}`} geometry={geometry} material={resources.glassMaterial} />
        ))}
        {resources.barbCore.map((geometry, index) => (
          <mesh key={`c${index}`} geometry={geometry} material={resources.coreMaterial} position={[0, 0, 0.0012]} />
        ))}
        <mesh geometry={resources.joint} material={resources.glassMaterial} position={tip} />
      </group>
    </group>
  );
}
