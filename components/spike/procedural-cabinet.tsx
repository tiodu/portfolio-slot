"use client";

import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { createArchGeometry, createArchTrimGeometry } from "@/lib/spike/geometry";
import { surface } from "@/lib/spike/materials";
import {
  arch,
  body,
  drawer,
  frontZ,
  plinth,
  reel,
  windowFrame,
} from "@/lib/spike/metrics";

export function ProceduralCabinet() {
  const archGeometry = useMemo(() => createArchGeometry(), []);
  const trimGeometry = useMemo(() => createArchTrimGeometry(), []);

  useEffect(() => {
    return () => {
      archGeometry.dispose();
      trimGeometry.dispose();
    };
  }, [archGeometry, trimGeometry]);

  const outerWidth = windowFrame.innerWidth + windowFrame.bar * 2;
  const outerHeight = windowFrame.innerHeight + windowFrame.bar * 2;

  return (
    <group>
      <RoundedBox
        args={[plinth.width, plinth.height, plinth.depth]}
        radius={0.04}
        smoothness={3}
        bevelSegments={2}
        position={[0, plinth.y, 0]}
      >
        <meshPhysicalMaterial {...surface.redDeep} />
      </RoundedBox>
      <RoundedBox
        args={[body.width, body.height, body.depth]}
        radius={body.radius}
        smoothness={4}
        bevelSegments={2}
        position={[0, body.y, 0]}
      >
        <meshPhysicalMaterial {...surface.red} />
      </RoundedBox>
      <mesh geometry={archGeometry} position={[0, arch.baseY, 0]}>
        <meshPhysicalMaterial {...surface.red} />
      </mesh>
      <mesh geometry={trimGeometry}>
        <meshStandardMaterial {...surface.chrome} />
      </mesh>

      <mesh position={[0, windowFrame.y, frontZ + 0.012]}>
        <planeGeometry args={[windowFrame.innerWidth, windowFrame.innerHeight]} />
        <meshStandardMaterial {...surface.dark} />
      </mesh>

      <RoundedBox
        args={[outerWidth, windowFrame.bar, windowFrame.depth]}
        radius={0.02}
        smoothness={2}
        bevelSegments={1}
        position={[
          0,
          windowFrame.y + windowFrame.innerHeight / 2 + windowFrame.bar / 2,
          windowFrame.z,
        ]}
      >
        <meshStandardMaterial {...surface.chrome} />
      </RoundedBox>
      <RoundedBox
        args={[outerWidth, windowFrame.bar, windowFrame.depth]}
        radius={0.02}
        smoothness={2}
        bevelSegments={1}
        position={[
          0,
          windowFrame.y - windowFrame.innerHeight / 2 - windowFrame.bar / 2,
          windowFrame.z,
        ]}
      >
        <meshStandardMaterial {...surface.chrome} />
      </RoundedBox>
      <RoundedBox
        args={[windowFrame.bar, outerHeight, windowFrame.depth]}
        radius={0.02}
        smoothness={2}
        bevelSegments={1}
        position={[
          -(windowFrame.innerWidth / 2 + windowFrame.bar / 2),
          windowFrame.y,
          windowFrame.z,
        ]}
      >
        <meshStandardMaterial {...surface.chrome} />
      </RoundedBox>
      <RoundedBox
        args={[windowFrame.bar, outerHeight, windowFrame.depth]}
        radius={0.02}
        smoothness={2}
        bevelSegments={1}
        position={[
          windowFrame.innerWidth / 2 + windowFrame.bar / 2,
          windowFrame.y,
          windowFrame.z,
        ]}
      >
        <meshStandardMaterial {...surface.chrome} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[0.05, windowFrame.innerHeight, windowFrame.depth]}
          radius={0.012}
          smoothness={2}
          bevelSegments={1}
          position={[
            side * ((reel.width + reel.gap) / 2),
            windowFrame.y,
            windowFrame.z + 0.02,
          ]}
        >
          <meshStandardMaterial {...surface.chrome} />
        </RoundedBox>
      ))}

      <mesh position={[0, windowFrame.y, reel.z + reel.radius + 0.06]}>
        <planeGeometry args={[windowFrame.innerWidth, windowFrame.innerHeight]} />
        <meshPhysicalMaterial {...surface.glass} />
      </mesh>

      <mesh position={[0, drawer.y + drawer.height / 2 + 0.045, frontZ + 0.02]}>
        <boxGeometry args={[drawer.width * 0.92, 0.045, 0.08]} />
        <meshStandardMaterial {...surface.dark} />
      </mesh>
      <RoundedBox
        args={[drawer.width, drawer.height, drawer.depth]}
        radius={0.03}
        smoothness={2}
        bevelSegments={1}
        position={[0, drawer.y, drawer.z]}
      >
        <meshStandardMaterial {...surface.drawer} />
      </RoundedBox>
      <mesh
        position={[0, drawer.y, drawer.z + drawer.depth / 2 + 0.02]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.016, 0.016, drawer.width * 0.42, 12]} />
        <meshStandardMaterial {...surface.chrome} />
      </mesh>

      <RoundedBox
        args={[0.07, 0.78, 0.38]}
        radius={0.02}
        smoothness={2}
        bevelSegments={1}
        position={[body.width / 2 + 0.02, 0.22, 0.02]}
      >
        <meshStandardMaterial {...surface.chrome} />
      </RoundedBox>
    </group>
  );
}
