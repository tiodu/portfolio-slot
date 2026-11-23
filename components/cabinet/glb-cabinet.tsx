"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { GLB_URL, glb } from "@/lib/cabinet/glb-metrics";

/** The Blender cabinet, standing on the floor, static for now. Reels, lever and bulbs come next. */
export function GlbCabinet({ onReady }: { onReady: () => void }) {
  const gltf = useGLTF(GLB_URL);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <group position={[0, glb.floorY - glb.footY * glb.scale, 0]} scale={glb.scale}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB_URL);
