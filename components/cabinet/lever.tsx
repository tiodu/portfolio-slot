"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { requestSpin } from "@/lib/cabinet/bus";
import { surface } from "@/lib/cabinet/materials";
import { lever } from "@/lib/cabinet/metrics";
import { useRig } from "./world";

export function Lever() {
  const rig = useRig();
  const pivot = useRef<THREE.Group>(null);
  const armGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.032, 0.038, lever.arm, 16),
    [],
  );

  useEffect(() => {
    return () => {
      armGeometry.dispose();
      document.body.style.cursor = "";
    };
  }, [armGeometry]);

  useFrame(() => {
    const group = pivot.current;
    if (!group) return;
    group.rotation.x = lever.rest + (lever.pulled - lever.rest) * rig.current.lever;
  });

  const pull = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    requestSpin();
  };

  const showPointer = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = "pointer";
  };

  const hidePointer = () => {
    document.body.style.cursor = "";
  };

  return (
    <group ref={pivot} position={[lever.x, lever.y, lever.z]}>
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.08, 20]} />
        <meshStandardMaterial {...surface.chrome} />
      </mesh>
      <mesh geometry={armGeometry} position={[0, -lever.arm / 2, 0]}>
        <meshStandardMaterial {...surface.chrome} />
      </mesh>
      <mesh
        position={[0, -lever.arm, 0]}
        onClick={pull}
        onPointerOver={showPointer}
        onPointerOut={hidePointer}
      >
        <sphereGeometry args={[lever.knob, 24, 16]} />
        <meshPhysicalMaterial {...surface.knob} />
      </mesh>
      <mesh
        position={[0, -lever.arm * 0.62, 0]}
        onClick={pull}
        onPointerOver={showPointer}
        onPointerOut={hidePointer}
      >
        <boxGeometry args={[0.42, lever.arm * 0.95, 0.42]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
