"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { neon } from "@/lib/spike/metrics";
import { createNeonTexture } from "@/lib/spike/symbols";

export function NeonSign({
  scriptFamily,
  onMesh,
  position,
}: {
  scriptFamily: string;
  onMesh: (mesh: THREE.Mesh | null) => void;
  position?: [number, number, number];
}) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const placed = position ?? [0, neon.y, neon.z];

  useEffect(() => {
    let cancelled = false;
    const draw = async () => {
      try {
        await document.fonts.load(`180px ${scriptFamily}`);
        await document.fonts.ready;
      } catch {
        // The canvas falls back to a cursive generic if the script face is late.
      }
      if (cancelled) return;
      setTexture(createNeonTexture(scriptFamily));
    };
    void draw();
    return () => {
      cancelled = true;
    };
  }, [scriptFamily]);

  useEffect(() => {
    return () => texture?.dispose();
  }, [texture]);

  if (!texture) return null;

  return (
    <mesh
      ref={(mesh) => {
        onMesh(mesh);
        return () => onMesh(null);
      }}
      position={placed}
    >
      <planeGeometry args={[neon.width, neon.height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}
