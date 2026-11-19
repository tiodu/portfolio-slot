"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createBulbMaterial } from "@/lib/cabinet/materials";
import { bulbLayout, bulbs, colors } from "@/lib/cabinet/metrics";
import { useReducedMotion } from "@/lib/cabinet/use-motion";

const hot = new THREE.Color(colors.bulbHot);
const rest = new THREE.Color(colors.bulbRest);
const PULSE_SIGMA = 1.45;

function ringDistance(index: number, head: number, count: number) {
  const raw = Math.abs(index - head);
  return Math.min(raw, count - raw);
}

function paintBulb(target: THREE.Color, distance: number, steady: boolean) {
  if (steady) return target.copy(rest);
  const pulse = Math.exp(-(distance * distance) / (2 * PULSE_SIGMA * PULSE_SIGMA));
  return target.copy(rest).lerp(hot, pulse);
}

function layoutInstances(
  mesh: THREE.InstancedMesh,
  positions: Array<{ x: number; y: number; z: number }>,
  dummy: THREE.Object3D,
  zOffset: number,
) {
  positions.forEach((point, index) => {
    dummy.position.set(point.x, point.y, point.z + zOffset);
    dummy.scale.set(1, 1, 1);
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
  const paintedSteady = useRef(false);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    const sockets = socketRef.current;
    if (!mesh || !sockets) return;
    layoutInstances(mesh, positions, dummy, 0);
    layoutInstances(sockets, positions, dummy, -0.02);
    positions.forEach((_, index) => {
      mesh.setColorAt(index, paintBulb(color, index, true));
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
      if (paintedSteady.current) return;
      positions.forEach((_, index) => {
        mesh.setColorAt(index, paintBulb(color, index, true));
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      paintedSteady.current = true;
      return;
    }
    paintedSteady.current = false;
    const head = (state.clock.elapsedTime * 3.2) % positions.length;
    positions.forEach((_, index) => {
      const distance = ringDistance(index, head, positions.length);
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
