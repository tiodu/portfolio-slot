"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GLB_URL, glb, glbFaceAspect } from "@/lib/cabinet/glb-metrics";
import { REEL_OFFSET } from "@/lib/cabinet/machine";
import { FACE_COUNT } from "@/lib/cabinet/symbol-list";
import { useSymbolMap } from "./reels";
import { useRig } from "./world";

/**
 * The Blender cabinet, standing on the floor. The reels turn with the machine; lever,
 * bulbs and neon come in later slices.
 *
 * The strip is drawn here, not in Blender, so the nine symbols have one source (symbol-list.ts).
 * The reel UVs wrap round the drum like the strip (see glb-contract.test.ts), so a reel turned
 * by `angle + REEL_OFFSET` shows the same face as the procedural reel does.
 */
export function GlbCabinet({ onReady }: { onReady: () => void }) {
  const rig = useRig();
  const gltf = useGLTF(GLB_URL);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const strip = useSymbolMap(onReady, glbFaceAspect(FACE_COUNT));
  const reels = useRef<THREE.Object3D[]>([]);

  useEffect(() => {
    reels.current = [0, 1, 2].flatMap((index) => scene.getObjectByName(`Reel${index}`) ?? []);
  }, [scene]);

  useEffect(() => {
    if (!strip) return;
    // glTF puts v = 0 at the top, so the strip is used unflipped.
    const map = strip.clone();
    map.flipY = false;
    map.needsUpdate = true;
    const painted = reels.current.map((reel) => {
      const material = (reel as THREE.Mesh).material as THREE.MeshStandardMaterial;
      const before = material.map;
      material.map = map;
      material.color.set("#ffffff");
      material.needsUpdate = true;
      return { material, before };
    });
    return () => {
      painted.forEach(({ material, before }) => {
        material.map = before;
      });
      map.dispose();
    };
  }, [strip, scene]);

  useFrame(() => {
    reels.current.forEach((reel, index) => {
      reel.rotation.x = rig.current.reels[index].angle + REEL_OFFSET;
    });
  });

  return (
    <group position={[0, glb.floorY - glb.footY * glb.scale, 0]} scale={glb.scale}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB_URL);
