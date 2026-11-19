"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createReelGeometry } from "@/lib/spike/geometry";
import { surface } from "@/lib/spike/materials";
import { reel, reelX } from "@/lib/spike/metrics";
import { REEL_OFFSET } from "@/lib/spike/rig";
import { createSymbolTexture } from "@/lib/spike/symbols";
import { useRig } from "./cabinet-world";

export function useSymbolMap() {
  const gl = useThree((state) => state.gl);
  return useMemo(
    () => createSymbolTexture(gl.capabilities.getMaxAnisotropy()),
    [gl],
  );
}

export function Reels() {
  const rig = useRig();
  const map = useSymbolMap();
  const geometry = useMemo(
    () => createReelGeometry(reel.radius, reel.width),
    [],
  );
  const materials = useMemo(
    () => [
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        map,
        roughness: 0.58,
        metalness: 0.02,
      }),
      new THREE.MeshStandardMaterial(surface.reelCap),
      new THREE.MeshStandardMaterial(surface.reelCap),
    ],
    [map],
  );
  const left = useRef<THREE.Mesh>(null);
  const middle = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);

  useEffect(() => {
    return () => {
      geometry.dispose();
      materials.forEach((material) => material.dispose());
      map.dispose();
    };
  }, [geometry, map, materials]);

  useFrame(() => {
    const meshes = [left.current, middle.current, right.current];
    meshes.forEach((mesh, index) => {
      if (!mesh) return;
      mesh.rotation.x = rig.current.reels[index].angle + REEL_OFFSET;
    });
  });

  return (
    <>
      <mesh
        ref={left}
        geometry={geometry}
        material={materials}
        position={[reelX(0), reel.y, reel.z]}
        dispose={null}
      />
      <mesh
        ref={middle}
        geometry={geometry}
        material={materials}
        position={[reelX(1), reel.y, reel.z]}
        dispose={null}
      />
      <mesh
        ref={right}
        geometry={geometry}
        material={materials}
        position={[reelX(2), reel.y, reel.z]}
        dispose={null}
      />
    </>
  );
}
