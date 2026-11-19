"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createBulbMaterial } from "@/lib/spike/materials";
import { bulbLayout, bulbs, colors } from "@/lib/spike/metrics";
import { useReducedMotion } from "@/lib/spike/use-motion";

const hot = new THREE.Color(colors.bulbHot);
const mid = new THREE.Color(colors.bulbMid);
const dim = new THREE.Color(colors.bulbDim);

function paintBulb(target: THREE.Color, distance: number, steady: boolean) {
  if (steady) return target.copy(dim).lerp(mid, 0.82);
  if (distance === 0) return target.copy(hot);
  if (distance === 1) return target.copy(mid).lerp(hot, 0.55);
  if (distance === 2) return target.copy(mid);
  if (distance === 3) return target.copy(dim).lerp(mid, 0.4);
  return target.copy(dim);
}

function layoutInstances(
  mesh: THREE.InstancedMesh,
  positions: Array<{ x: number; y: number; z: number }>,
  dummy: THREE.Object3D,
  zOffset: number,
  scale: number,
) {
  positions.forEach((point, index) => {
    dummy.position.set(point.x, point.y, point.z + zOffset);
    dummy.scale.set(scale, scale, scale);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

export function Bulbs({
  onMesh,
}: {
  onMesh: (mesh: THREE.InstancedMesh | null) => void;
}) {
  const reduced = useReducedMotion();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const socketRef = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => bulbLayout(), []);
  const material = useMemo(() => createBulbMaterial(), []);
  const geometry = useMemo(
    () => new THREE.SphereGeometry(bulbs.radius, 16, 12),
    [],
  );
  const socketGeometry = useMemo(
    () => new THREE.SphereGeometry(bulbs.radius * 1.28, 12, 8),
    [],
  );
  const socketMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#24180f",
        metalness: 0.72,
        roughness: 0.38,
      }),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const lastStep = useRef(-1);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    const sockets = socketRef.current;
    if (!mesh || !sockets) return;
    layoutInstances(mesh, positions, dummy, 0, 1);
    layoutInstances(sockets, positions, dummy, -0.02, 1);
    positions.forEach((_, index) => {
      mesh.setColorAt(index, paintBulb(color, 4, true));
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    onMesh(mesh);
    return () => onMesh(null);
  }, [color, dummy, onMesh, positions]);

  useEffect(() => {
    return () => {
      material.dispose();
      geometry.dispose();
      socketGeometry.dispose();
      socketMaterial.dispose();
    };
  }, [geometry, material, socketGeometry, socketMaterial]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (reduced) {
      if (lastStep.current === -2) return;
      positions.forEach((_, index) => {
        mesh.setColorAt(index, paintBulb(color, index, true));
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      lastStep.current = -2;
      return;
    }
    if (lastStep.current === -2) lastStep.current = -1;
    const step = Math.floor(state.clock.elapsedTime * 9);
    if (step === lastStep.current) return;
    lastStep.current = step;
    const head = step % positions.length;
    positions.forEach((_, index) => {
      const distance = (index - head + positions.length) % positions.length;
      mesh.setColorAt(index, paintBulb(color, distance, false));
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh
        ref={socketRef}
        args={[socketGeometry, socketMaterial, positions.length]}
        dispose={null}
        frustumCulled={false}
      />
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, positions.length]}
        dispose={null}
        frustumCulled={false}
      />
    </>
  );
}
