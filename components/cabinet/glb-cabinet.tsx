"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createBulbMaterial } from "@/lib/cabinet/materials";
import { GLB_URL, glb, glbFaceAspect } from "@/lib/cabinet/glb-metrics";
import { REEL_OFFSET } from "@/lib/cabinet/machine";
import { FACE_COUNT } from "@/lib/cabinet/symbol-list";
import { useReducedMotion } from "@/lib/cabinet/use-motion";
import { CHASE_SPEED, paintBulb, ringDistance } from "./bulbs";
import { useSymbolMap } from "./reels";
import { useRig } from "./world";

/** How far the lever turns when it is fully pulled, in radians. It swings towards the player. */
const LEVER_PULLED = 1.15;

/**
 * The Blender cabinet, standing on the floor. The machine drives its reels, lever and bulbs;
 * the neon comes in a later slice.
 *
 * The strip is drawn here, not in Blender, so the nine symbols have one source (symbol-list.ts).
 * The reel UVs wrap round the drum like the strip (see glb-contract.test.ts), so a reel turned
 * by `angle + REEL_OFFSET` shows the same face as the procedural reel does.
 */
export function GlbCabinet({
  onReady,
  onBulbs,
}: {
  onReady: () => void;
  /** Gets the bulbs as one instanced mesh, for the bloom, and null when they go away. */
  onBulbs: (mesh: THREE.InstancedMesh | null) => void;
}) {
  const rig = useRig();
  const reduced = useReducedMotion();
  const gltf = useGLTF(GLB_URL);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const strip = useSymbolMap(onReady, glbFaceAspect(FACE_COUNT));
  const reels = useRef<THREE.Object3D[]>([]);
  const lever = useRef<THREE.Object3D | null>(null);
  const bulbs = useRef<THREE.InstancedMesh | null>(null);
  const colour = useMemo(() => new THREE.Color(), []);
  const steady = useRef(false);

  useEffect(() => {
    reels.current = [0, 1, 2].flatMap((index) => scene.getObjectByName(`Reel${index}`) ?? []);
    lever.current = scene.getObjectByName("LeverPivot") ?? null;
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

  // The 45 bulb nodes share one mesh. Draw them as one instanced mesh, so each can take its own
  // colour for the chase, and the bloom has a single object to select.
  useEffect(() => {
    const nodes: THREE.Mesh[] = [];
    scene.traverse((object) => {
      if (/^Bulb\d\d$/.test(object.name) && (object as THREE.Mesh).isMesh) nodes.push(object as THREE.Mesh);
    });
    if (nodes.length === 0) return;
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    scene.updateMatrixWorld(true);
    const toScene = new THREE.Matrix4().copy(scene.matrixWorld).invert();
    const material = createBulbMaterial();
    const mesh = new THREE.InstancedMesh(nodes[0].geometry, material, nodes.length);
    nodes.forEach((node, index) => {
      mesh.setMatrixAt(index, new THREE.Matrix4().multiplyMatrices(toScene, node.matrixWorld));
      mesh.setColorAt(index, paintBulb(colour, index, true));
      node.visible = false;
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    scene.add(mesh);
    bulbs.current = mesh;
    onBulbs(mesh);
    return () => {
      onBulbs(null);
      bulbs.current = null;
      scene.remove(mesh);
      mesh.dispose();
      material.dispose();
      nodes.forEach((node) => {
        node.visible = true;
      });
    };
  }, [scene, colour, onBulbs]);

  useFrame((state) => {
    reels.current.forEach((reel, index) => {
      reel.rotation.x = rig.current.reels[index].angle + REEL_OFFSET;
    });
    if (lever.current) lever.current.rotation.x = LEVER_PULLED * rig.current.lever;

    const mesh = bulbs.current;
    if (!mesh) return;
    if (reduced && steady.current) return;
    steady.current = reduced;
    const count = mesh.count;
    const head = (state.clock.elapsedTime * CHASE_SPEED) % count;
    for (let index = 0; index < count; index += 1) {
      const distance = ringDistance(index, head, count);
      mesh.setColorAt(index, paintBulb(colour, distance, reduced));
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group position={[0, glb.floorY - glb.footY * glb.scale, 0]} scale={glb.scale}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB_URL);
