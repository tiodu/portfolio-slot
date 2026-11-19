"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Bulbs } from "./bulbs";
import { Lever } from "./lever";
import { NeonSign } from "./neon-sign";
import { ProceduralCabinet } from "./procedural-cabinet";
import { Reels } from "./reels";
import { SceneShell } from "./scene-shell";

export function ProceduralScene({
  scriptFamily,
  onReady,
}: {
  scriptFamily: string;
  onReady: () => void;
}) {
  const [bulbMesh, setBulbMesh] = useState<THREE.InstancedMesh | null>(null);
  const [neonMesh, setNeonMesh] = useState<THREE.Mesh | null>(null);
  const [fontFailed, setFontFailed] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setFontFailed(true), 1500);
    return () => window.clearTimeout(timeout);
  }, []);

  const onBulbs = useCallback((mesh: THREE.InstancedMesh | null) => {
    setBulbMesh(mesh);
  }, []);
  const targets = useMemo(() => {
    const list: THREE.Object3D[] = [];
    if (bulbMesh) list.push(bulbMesh);
    if (neonMesh) list.push(neonMesh);
    return list;
  }, [bulbMesh, neonMesh]);

  return (
    <SceneShell
      readyToShow={neonMesh !== null || fontFailed}
      targets={targets}
      onReady={onReady}
    >
      <ProceduralCabinet />
      <Reels />
      <Bulbs onMesh={onBulbs} />
      <Lever />
      <NeonSign scriptFamily={scriptFamily} onMesh={setNeonMesh} />
    </SceneShell>
  );
}
