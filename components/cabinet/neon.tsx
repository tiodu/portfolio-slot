"use client";

import { Text } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createArrowGeometry } from "@/lib/cabinet/geometry";
import { createNeonMaterial } from "@/lib/cabinet/materials";
import { burst, colors, frontZ } from "@/lib/cabinet/metrics";

const FONT = "/fonts/GreatVibes-Regular.ttf";

export function NeonSign({
  onTargets,
}: {
  onTargets: (objects: THREE.Object3D[]) => void;
}) {
  const pink = useRef<THREE.Object3D>(null);
  const cyan = useRef<THREE.Object3D>(null);
  const arrow = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Mesh>(null);
  const reported = useRef(false);
  const geometry = useMemo(() => createArrowGeometry(), []);
  const material = useMemo(() => createNeonMaterial(colors.neonPink), []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const publish = () => {
    if (reported.current) return;
    const objects = [pink.current, cyan.current, arrow.current, head.current].filter(
      (object): object is THREE.Object3D => object !== null,
    );
    if (objects.length < 4) return;
    reported.current = true;
    onTargets(objects);
  };

  const mark = (mesh: THREE.Object3D) => {
    const materialOnMesh = (mesh as THREE.Mesh).material;
    const list = Array.isArray(materialOnMesh) ? materialOnMesh : [materialOnMesh];
    list.forEach((entry) => {
      if (entry) entry.toneMapped = false;
    });
    publish();
  };

  return (
    <group position={[0, burst.y + 0.02, frontZ + 0.08]}>
      <Text
        ref={pink}
        font={FONT}
        characters="Eduardo de Souza"
        fontSize={0.34}
        color={colors.neonPink}
        anchorX="center"
        anchorY="middle"
        position={[0, 0.22, 0.03]}
        outlineWidth={0.012}
        outlineColor={colors.neonPink}
        outlineOpacity={0.85}
        outlineBlur={0.02}
        onSync={mark}
      >
        Eduardo
      </Text>
      <Text
        ref={cyan}
        font={FONT}
        characters="Eduardo de Souza"
        fontSize={0.22}
        color={colors.neonCyan}
        anchorX="center"
        anchorY="middle"
        position={[0.04, -0.02, 0.03]}
        outlineWidth={0.008}
        outlineColor={colors.neonCyan}
        outlineOpacity={0.8}
        outlineBlur={0.015}
        onSync={mark}
      >
        de Souza
      </Text>
      <mesh ref={arrow} geometry={geometry} material={material} />
      <mesh ref={head} position={[0.05, -0.62, 0.02]} rotation={[0, 0, Math.PI]} material={material}>
        <coneGeometry args={[0.04, 0.09, 12]} />
      </mesh>
    </group>
  );
}
