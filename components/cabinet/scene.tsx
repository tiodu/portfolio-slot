"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { glbRequested } from "@/lib/cabinet/glb-metrics";
import { useCompactViewport, usePixelRatio, useReducedMotion } from "@/lib/cabinet/use-motion";
import { Bulbs } from "./bulbs";
import { CabinetBody } from "./body";
import { GlbCabinet } from "./glb-cabinet";
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
  const [glbOn] = useState(glbRequested);
  const [glbReady, setGlbReady] = useState(false);
  const onGlb = useCallback(() => setGlbReady(true), []);

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
      alpha: true,
      premultipliedAlpha: true,
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
      camera={{ fov: 30, near: 0.1, far: 40, position: [1.45, 0.55, 7.2] }}
      style={{ background: "transparent" }}
      onCreated={({ gl: renderer }) => {
        renderer.setClearColor(0x000000, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.02;
      }}
    >
      <CabinetWorld
        reduced={reduced}
        compact={compact}
        targets={targets}
        readyToShow={glbOn ? glbReady : (neonTargets.length > 0 || fontFailed) && symbolsReady}
        onReady={show}
      >
        {glbOn ? (
          <GlbCabinet onReady={onGlb} />
        ) : (
          <>
            <CabinetBody />
            <Reels onReady={onSymbols} />
            <Bulbs onMesh={onBulbs} />
            <Lever />
            <NeonSign onTargets={onNeon} />
          </>
        )}
      </CabinetWorld>
    </Canvas>
  );
}
