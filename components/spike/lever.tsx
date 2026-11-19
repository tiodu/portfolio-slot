"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { requestSpin } from "@/lib/spike/bus";
import { surface } from "@/lib/spike/materials";
import { lever } from "@/lib/spike/metrics";
import { useRig } from "./cabinet-world";

function rememberLeverPoint(object: THREE.Object3D, camera: THREE.Camera, canvas: HTMLCanvasElement) {
  const point = new THREE.Vector3(0, -lever.arm, 0);
  object.localToWorld(point);
  point.project(camera);
  const rect = canvas.getBoundingClientRect();
  const root = canvas.closest(".spike-scene");
  if (!(root instanceof HTMLElement)) return;
  root.dataset.leverX = String(Math.round(rect.left + (point.x * 0.5 + 0.5) * rect.width));
  root.dataset.leverY = String(Math.round(rect.top + (-point.y * 0.5 + 0.5) * rect.height));
}

export function Lever({ visual = true }: { visual?: boolean }) {
  const rig = useRig();
  const pivot = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const marked = useRef(false);
  const armGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.032, 0.038, lever.arm, 12),
    [],
  );

  useFrame(() => {
    const group = pivot.current;
    if (!group) return;
    group.rotation.x = lever.rest + (lever.pulled - lever.rest) * rig.current.lever;
    if (!marked.current) {
      marked.current = true;
      rememberLeverPoint(group, camera, gl.domElement);
    }
  });

  const pull = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    requestSpin();
  };

  return (
    <group ref={pivot} position={[lever.x, lever.y, lever.z]}>
      {visual ? (
        <>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.08, 16]} />
            <meshStandardMaterial {...surface.chrome} />
          </mesh>
          <mesh geometry={armGeometry} position={[0, -lever.arm / 2, 0]}>
            <meshStandardMaterial {...surface.chrome} />
          </mesh>
          <mesh
            position={[0, -lever.arm, 0]}
            onClick={pull}
            onPointerOver={(event) => {
              event.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "";
            }}
          >
            <sphereGeometry args={[lever.knob, 24, 16]} />
            <meshPhysicalMaterial {...surface.knob} />
          </mesh>
        </>
      ) : null}
      <mesh
        position={[0, -lever.arm * 0.62, 0]}
        onClick={pull}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <boxGeometry args={[0.42, lever.arm * 0.95, 0.42]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
