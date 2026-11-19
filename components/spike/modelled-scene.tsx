"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { createOverrideMaterials } from "@/lib/spike/materials";
import { colors, lever, neon } from "@/lib/spike/metrics";
import { REEL_OFFSET } from "@/lib/spike/rig";
import { useReducedMotion } from "@/lib/spike/use-motion";
import { useRig } from "./cabinet-world";
import { Lever } from "./lever";
import { NeonSign } from "./neon-sign";
import { useSymbolMap } from "./reels";
import { SceneShell } from "./scene-shell";

export const MODEL_URL = "/models/cabinet.glb";

// Uncompressed spike model. A Draco file from Blender or Spline uses
// useGLTF(url, true) and a Meshopt file uses useGLTF(url, false, true).
// drei then attaches the decoders. Materials are replaced after load so the
// symbol strip and the bulb chase stay driven from code.
useGLTF.preload(MODEL_URL, false, false);

const hot = new THREE.Color(colors.bulbHot);
const mid = new THREE.Color(colors.bulbMid);
const dim = new THREE.Color(colors.bulbDim);

function bulbEmissive(target: THREE.Color, distance: number, steady: boolean) {
  if (steady) return target.copy(dim).lerp(mid, 0.82);
  if (distance === 0) return target.copy(hot);
  if (distance === 1) return target.copy(mid).lerp(hot, 0.55);
  if (distance === 2) return target.copy(mid);
  if (distance === 3) return target.copy(dim).lerp(mid, 0.4);
  return target.copy(dim);
}

function LoadedCabinet({
  onBulbs,
  onAnchor,
  onReady,
}: {
  onBulbs: (meshes: THREE.Mesh[]) => void;
  onAnchor: (position: [number, number, number]) => void;
  onReady: () => void;
}) {
  const gltf = useGLTF(MODEL_URL, false, false);
  const map = useSymbolMap();
  const reduced = useReducedMotion();
  const rig = useRig();
  const scratch = useMemo(() => new THREE.Color(), []);
  const lastStep = useRef(-1);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const materials = useMemo(() => createOverrideMaterials(map), [map]);

  const bound = useMemo(() => {
    const found: {
      reels: THREE.Object3D[];
      bulbMeshes: THREE.Mesh[];
      leverPivot: THREE.Object3D | null;
      anchor: THREE.Object3D | null;
    } = {
      reels: [],
      bulbMeshes: [],
      leverPivot: null,
      anchor: scene.getObjectByName("TopperAnchor") ?? null,
    };
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) {
        if (object.name === "LeverPivot") found.leverPivot = object;
        return;
      }
      const name = object.name;
      if (name.startsWith("Bulb")) {
        object.material = materials.bulb();
        found.bulbMeshes.push(object);
        return;
      }
      if (name.startsWith("Reel")) {
        // The exported cylinder is one primitive, so one material covers the
        // side and the caps. The caps sit at the reel edges.
        object.material = materials.reelSide;
        found.reels.push(object);
        return;
      }
      if (name === "Glass") object.material = materials.glass;
      else if (name === "Drawer") object.material = materials.drawer;
      else if (name === "LeverKnob") object.material = materials.knob;
      else if (name === "WindowBacking" || name === "DrawerMouth") object.material = materials.dark;
      else if (name.startsWith("Socket")) object.material = materials.socket;
      else if (
        name.startsWith("Bezel") ||
        name.startsWith("Divider") ||
        name.startsWith("Screw") ||
        name === "ArchTrim" ||
        name === "InnerTrim" ||
        name === "DrawerHandle" ||
        name === "LeverCollar" ||
        name === "LeverArm" ||
        name === "LeverPlate"
      ) {
        object.material = materials.chrome;
      } else if (name === "Body" || name === "Arch" || name === "Plinth") {
        object.material = materials.red;
      }
    });
    found.bulbMeshes.sort((a, b) => a.name.localeCompare(b.name));
    found.reels.sort((a, b) => a.name.localeCompare(b.name));
    return found;
  }, [materials, scene]);

  const reelsRef = useRef(bound.reels);
  const bulbsRef = useRef(bound.bulbMeshes);
  const leverRef = useRef(bound.leverPivot);

  useEffect(() => {
    reelsRef.current = bound.reels;
    bulbsRef.current = bound.bulbMeshes;
    leverRef.current = bound.leverPivot;
    onBulbs(bound.bulbMeshes);
    if (bound.anchor) {
      onAnchor([bound.anchor.position.x, bound.anchor.position.y, bound.anchor.position.z]);
    }
    onReady();
    return () => {
      onBulbs([]);
      materials.dispose();
      bound.bulbMeshes.forEach((bulb) => {
        const material = bulb.material;
        if (material instanceof THREE.Material) material.dispose();
      });
    };
  }, [bound, materials, onAnchor, onBulbs, onReady]);

  useEffect(() => () => map.dispose(), [map]);

  useFrame((state) => {
    reelsRef.current.forEach((reelMesh, index) => {
      const spin = rig.current.reels[index];
      if (!spin) return;
      reelMesh.rotation.x = spin.angle + REEL_OFFSET;
    });
    const pivot = leverRef.current;
    if (pivot) {
      pivot.rotation.x = lever.rest + (lever.pulled - lever.rest) * rig.current.lever;
    }
    const steady = reduced;
    const bulbsNow = bulbsRef.current;
    if (steady) {
      if (lastStep.current === -2) return;
      bulbsNow.forEach((bulb) => {
        const material = bulb.material;
        if (material instanceof THREE.MeshStandardMaterial) {
          material.emissive.copy(bulbEmissive(scratch, 0, true));
        }
      });
      lastStep.current = -2;
      return;
    }
    if (lastStep.current === -2) lastStep.current = -1;
    const step = Math.floor(state.clock.elapsedTime * 9);
    if (step === lastStep.current) return;
    lastStep.current = step;
    const count = bulbsNow.length;
    if (count === 0) return;
    const head = step % count;
    bulbsNow.forEach((bulb, index) => {
      const material = bulb.material;
      if (!(material instanceof THREE.MeshStandardMaterial)) return;
      const distance = (index - head + count) % count;
      material.emissive.copy(bulbEmissive(scratch, distance, false));
    });
  });

  return <primitive object={scene} />;
}

class ModelBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export function ModelledScene({
  scriptFamily,
  onReady,
}: {
  scriptFamily: string;
  onReady: () => void;
}) {
  const [bulbMeshes, setBulbMeshes] = useState<THREE.Mesh[]>([]);
  const [neonMesh, setNeonMesh] = useState<THREE.Mesh | null>(null);
  const [anchor, setAnchor] = useState<[number, number, number]>([0, neon.y, neon.z]);
  const [modelReady, setModelReady] = useState(false);
  const [fontFailed, setFontFailed] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setFontFailed(true), 1500);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!modelFailed) return;
    const root = document.querySelector(".spike-scene");
    if (root instanceof HTMLElement) root.dataset.modelError = "true";
  }, [modelFailed]);

  const onBulbs = useCallback((meshes: THREE.Mesh[]) => {
    setBulbMeshes(meshes);
  }, []);
  const onAnchor = useCallback((position: [number, number, number]) => {
    setAnchor(position);
  }, []);
  const onModelReady = useCallback(() => setModelReady(true), []);
  const onNeon = useCallback((mesh: THREE.Mesh | null) => setNeonMesh(mesh), []);

  const targets = useMemo(() => {
    const list: THREE.Object3D[] = [...bulbMeshes];
    if (neonMesh) list.push(neonMesh);
    return list;
  }, [bulbMeshes, neonMesh]);

  return (
    <SceneShell
      readyToShow={(modelReady || modelFailed) && (neonMesh !== null || fontFailed)}
      targets={targets}
      onReady={onReady}
    >
      <ModelBoundary onError={() => setModelFailed(true)}>
        <Suspense fallback={null}>
          <LoadedCabinet onBulbs={onBulbs} onAnchor={onAnchor} onReady={onModelReady} />
        </Suspense>
      </ModelBoundary>
      <NeonSign scriptFamily={scriptFamily} onMesh={onNeon} position={anchor} />
      <Lever visual={false} />
    </SceneShell>
  );
}
