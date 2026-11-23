"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { createReelGeometry } from "@/lib/cabinet/geometry";
import { surface } from "@/lib/cabinet/materials";
import { reel, reelX } from "@/lib/cabinet/metrics";
import { REEL_OFFSET } from "@/lib/cabinet/machine";
import { createSymbolTexture } from "@/lib/cabinet/symbols";
import { useRig } from "./world";

/** The 9-face strip, drawn once the fonts are ready. Calls onReady when it exists. */
export function useSymbolMap(onReady: () => void, aspect = 1) {
  const gl = useThree((state) => state.gl);
  const [map, setMap] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      setMap(createSymbolTexture(gl.capabilities.getMaxAnisotropy(), aspect));
      onReady();
    });
    return () => {
      cancelled = true;
    };
  }, [gl, onReady, aspect]);

  useEffect(() => {
    return () => map?.dispose();
  }, [map]);

  return map;
}

export function Reels({ onReady }: { onReady: () => void }) {
  const rig = useRig();
  const map = useSymbolMap(onReady);
  const geometry = useMemo(
    () => createReelGeometry(reel.radius, reel.width),
    [],
  );
  const materials = useMemo(() => {
    if (!map) return null;
    return [
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        map,
        roughness: 0.58,
        metalness: 0.02,
      }),
      new THREE.MeshStandardMaterial(surface.reelCap),
      new THREE.MeshStandardMaterial(surface.reelCap),
    ];
  }, [map]);
  const left = useRef<THREE.Mesh>(null);
  const middle = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    return () => {
      materials?.forEach((material) => material.dispose());
    };
  }, [materials]);

  useFrame(() => {
    const meshes = [left.current, middle.current, right.current];
    meshes.forEach((mesh, index) => {
      if (!mesh) return;
      mesh.rotation.x = rig.current.reels[index].angle + REEL_OFFSET;
    });
  });

  if (!map || !materials) return null;

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
