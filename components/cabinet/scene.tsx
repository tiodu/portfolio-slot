"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useCompactViewport, usePixelRatio, useReducedMotion } from "@/lib/cabinet/use-motion";
import { Bulbs } from "./bulbs";
import { CabinetBody } from "./body";
import { Lever } from "./lever";
import { NeonSign } from "./neon";
import { Reels } from "./reels";
import { CabinetWorld } from "./world";

export function CabinetScene({
  capture,
  onReady,
}: {
  capture: boolean;
  onReady: () => void;
}) {
  const reduced = useReducedMotion();
  const compact = useCompactViewport();
  const dpr = usePixelRatio(compact);
  const [bulbMesh, setBulbMesh] = useState<THREE.InstancedMesh | null>(null);
  const [neonTargets, setNeonTargets] = useState<THREE.Object3D[]>([]);
  const [symbolsReady, setSymbolsReady] = useState(false);
  const [fontFailed, setFontFailed] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setFontFailed(true), 2500);
    return () => window.clearTimeout(timeout);
  }, []);

  const onBulbs = useCallback((mesh: THREE.InstancedMesh | null) => {
    setBulbMesh(mesh);
  }, []);
  const onSymbols = useCallback(() => setSymbolsReady(true), []);
  const onNeon = useCallback((objects: THREE.Object3D[]) => {
    setNeonTargets(objects);
  }, []);
  const targets = useMemo(() => {
    const list: THREE.Object3D[] = [];
    if (bulbMesh) list.push(bulbMesh);
    list.push(...neonTargets);
    return list;
  }, [bulbMesh, neonTargets]);

  const gl = useMemo(
    () => ({
      antialias: !compact,
      alpha: false,
      powerPreference: "high-performance" as const,
      stencil: false,
      preserveDrawingBuffer: capture,
    }),
    [capture, compact],
  );

  const show = useCallback(() => {
    onReady();
  }, [onReady]);

  return (
    <Canvas
      dpr={dpr}
      frameloop={reduced ? "demand" : "always"}
      gl={gl}
      tabIndex={-1}
      camera={{ fov: 30, near: 0.1, far: 40, position: [2.55, 0.42, 7.6] }}
      onCreated={({ gl: renderer }) => {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.02;
      }}
    >
      <CabinetWorld
        reduced={reduced}
        compact={compact}
        targets={targets}
        readyToShow={(neonTargets.length > 0 || fontFailed) && symbolsReady}
        onReady={show}
      >
        <CabinetBody />
        <Reels onReady={onSymbols} />
        <Bulbs onMesh={onBulbs} />
        <Lever />
        <NeonSign onTargets={onNeon} />
      </CabinetWorld>
    </Canvas>
  );
}
