"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useCompactViewport, usePixelRatio, useReducedMotion } from "@/lib/spike/use-motion";
import { CabinetStill } from "./cabinet-still";
import { CabinetWorld } from "./cabinet-world";

export function SceneShell({
  readyToShow,
  targets,
  onReady,
  children,
}: {
  readyToShow: boolean;
  targets: THREE.Object3D[];
  onReady: () => void;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const compact = useCompactViewport();
  const dpr = usePixelRatio(compact);
  const [live, setLive] = useState(false);

  const show = useCallback(() => {
    setLive(true);
    onReady();
  }, [onReady]);

  useEffect(() => {
    const canvas = document.querySelector(".spike-scene");
    if (canvas instanceof HTMLElement) {
      canvas.dataset.reduced = reduced ? "true" : "false";
      canvas.dataset.chase = reduced ? "off" : "on";
    }
  }, [reduced]);

  const gl = useMemo(
    () => ({
      antialias: !compact,
      alpha: false,
      powerPreference: "high-performance" as const,
      stencil: false,
    }),
    [compact],
  );

  return (
    <>
      {live ? null : <CabinetStill />}
      <Canvas
        dpr={dpr}
        frameloop={reduced ? "demand" : "always"}
        gl={gl}
        camera={{ fov: 30, near: 0.1, far: 40, position: [0.45, 0.16, 6.4] }}
        style={{
          position: "absolute",
          inset: 0,
          opacity: live ? 1 : 0,
        }}
        onCreated={({ gl: renderer }) => {
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.08;
          const context = renderer.getContext();
          const debug = context.getExtension("WEBGL_debug_renderer_info");
          const name = debug
            ? String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL))
            : String(context.getParameter(context.RENDERER));
          const root = renderer.domElement.closest(".spike-scene");
          if (root instanceof HTMLElement) root.dataset.renderer = name;
        }}
      >
        <CabinetWorld
          reduced={reduced}
          compact={compact}
          targets={targets}
          readyToShow={readyToShow}
          onReady={show}
        >
          {children}
        </CabinetWorld>
      </Canvas>
    </>
  );
}
