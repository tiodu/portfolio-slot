"use client";

import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import type { Texture } from "three";
import {
  createFanGeometry,
  createStarburstGeometry,
  createWingGeometry,
} from "@/lib/cabinet/geometry";
import { surface } from "@/lib/cabinet/materials";
import {
  badge,
  body,
  burst,
  frontZ,
  plinth,
  reel,
  tray,
  windowFrame,
} from "@/lib/cabinet/metrics";
import { createStickerTextures } from "@/lib/cabinet/stickers";

export function CabinetBody() {
  const creamBurst = useMemo(
    () => createStarburstGeometry(burst.outer, burst.inner, burst.depth),
    [],
  );
  const chromeBurst = useMemo(
    () => createStarburstGeometry(burst.outer * 1.07, burst.inner * 1.05, burst.depth * 0.72),
    [],
  );
  const wingLeft = useMemo(() => createWingGeometry(1), []);
  const wingRight = useMemo(() => createWingGeometry(-1), []);
  const fan = useMemo(() => createFanGeometry(), []);
  const stickers = useMemo(() => createStickerTextures(), []);

  useEffect(() => {
    return () => {
      creamBurst.dispose();
      chromeBurst.dispose();
      wingLeft.dispose();
      wingRight.dispose();
      fan.dispose();
      stickers.shapes.dispose();
      stickers.asterisk.dispose();
      stickers.ship.dispose();
    };
  }, [chromeBurst, creamBurst, fan, stickers, wingLeft, wingRight]);

  const creamWidth = body.width - 0.32;
  const creamHeight = body.height - 0.05;
  const outerWidth = windowFrame.innerWidth + windowFrame.bar * 2;
  const outerHeight = windowFrame.innerHeight + windowFrame.bar * 2;
  const baseTop = plinth.y + plinth.height / 2;

  return (
    <group>
      <RoundedBox
        args={[body.width, body.height, body.depth]}
        radius={body.radius}
        smoothness={5}
        bevelSegments={3}
        position={[0, body.y, 0]}
      >
        <meshPhysicalMaterial {...surface.turquoise} />
      </RoundedBox>
      <RoundedBox
        args={[creamWidth, creamHeight, 0.1]}
        radius={0.06}
        smoothness={4}
        bevelSegments={2}
        position={[0, body.y + 0.01, frontZ + 0.02]}
      >
        <meshPhysicalMaterial {...surface.cream} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[0.032, creamHeight * 0.92, 0.05]}
          radius={0.012}
          smoothness={2}
          bevelSegments={1}
          position={[side * (creamWidth / 2 + 0.008), body.y, frontZ + 0.06]}
        >
          <meshStandardMaterial {...surface.chrome} />
        </RoundedBox>
      ))}
      <RoundedBox
        args={[creamWidth + 0.04, 0.04, 0.05]}
        radius={0.014}
        smoothness={2}
        bevelSegments={1}
        position={[0, body.y + creamHeight / 2 - 0.01, frontZ + 0.06]}
      >
        <meshStandardMaterial {...surface.chrome} />
      </RoundedBox>

      <mesh geometry={chromeBurst} position={[0, burst.y, frontZ - 0.08]}>
        <meshStandardMaterial {...surface.chrome} />
      </mesh>
      <mesh geometry={creamBurst} position={[0, burst.y, frontZ - 0.02]}>
        <meshPhysicalMaterial {...surface.cream} />
      </mesh>

      <RoundedBox
        args={[plinth.width, plinth.height, plinth.depth]}
        radius={0.05}
        smoothness={3}
        bevelSegments={2}
        position={[0, plinth.y, 0]}
      >
        <meshPhysicalMaterial {...surface.turquoiseDeep} />
      </RoundedBox>
      <RoundedBox
        args={[plinth.width + 0.04, 0.04, plinth.depth + 0.04]}
        radius={0.016}
        smoothness={2}
        bevelSegments={1}
        position={[0, baseTop - 0.01, 0]}
      >
        <meshStandardMaterial {...surface.chrome} />
      </RoundedBox>

      <mesh position={[0, windowFrame.y, frontZ + 0.02]}>
        <planeGeometry args={[windowFrame.innerWidth, windowFrame.innerHeight]} />
        <meshStandardMaterial {...surface.dark} />
      </mesh>
      <RoundedBox
        args={[outerWidth, windowFrame.bar, windowFrame.depth]}
        radius={0.018}
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
        radius={0.018}
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
      {[-1, 1].map((side) => (
        <RoundedBox
          key={`window-${side}`}
          args={[windowFrame.bar, outerHeight, windowFrame.depth]}
          radius={0.018}
          smoothness={2}
          bevelSegments={1}
          position={[
            side * (windowFrame.innerWidth / 2 + windowFrame.bar / 2),
            windowFrame.y,
            windowFrame.z,
          ]}
        >
          <meshStandardMaterial {...surface.chrome} />
        </RoundedBox>
      ))}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={`divider-${side}`}
          args={[0.045, windowFrame.innerHeight, windowFrame.depth]}
          radius={0.012}
          smoothness={2}
          bevelSegments={1}
          position={[side * ((reel.width + reel.gap) / 2), windowFrame.y, windowFrame.z + 0.02]}
        >
          <meshStandardMaterial {...surface.chrome} />
        </RoundedBox>
      ))}
      <mesh position={[0, windowFrame.y, reel.z + reel.radius + 0.05]}>
        <planeGeometry args={[windowFrame.innerWidth, windowFrame.innerHeight]} />
        <meshPhysicalMaterial {...surface.glass} />
      </mesh>

      <group position={[0, badge.y, badge.z]}>
        <mesh position={[0, 0, -0.04]}>
          <planeGeometry args={[1.28, 0.32]} />
          <meshStandardMaterial {...surface.dark} />
        </mesh>
        <mesh geometry={wingLeft}>
          <meshStandardMaterial {...surface.chrome} side={2} />
        </mesh>
        <mesh geometry={wingRight}>
          <meshStandardMaterial {...surface.chrome} side={2} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.075, 0.012, 12, 28]} />
          <meshStandardMaterial {...surface.chrome} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.052, 28, 18]} />
          <meshPhysicalMaterial {...surface.jewel} />
        </mesh>
      </group>
      <mesh
        geometry={fan}
        position={[-0.62, badge.y - 0.02, badge.z - 0.02]}
        rotation={[0, 0, Math.PI * 0.55]}
      >
        <meshPhysicalMaterial {...surface.turquoise} />
      </mesh>
      <mesh
        geometry={fan}
        position={[0.62, badge.y - 0.02, badge.z - 0.02]}
        rotation={[0, 0, -Math.PI * 0.55]}
        scale={[-1, 1, 1]}
      >
        <meshPhysicalMaterial {...surface.turquoise} />
      </mesh>

      <RoundedBox
        args={[tray.width, tray.height, tray.depth]}
        radius={0.03}
        smoothness={3}
        bevelSegments={2}
        position={[0, tray.y, tray.z]}
      >
        <meshStandardMaterial {...surface.chrome} />
      </RoundedBox>
      <mesh
        position={[0, tray.y, tray.z + tray.depth / 2 + 0.012]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.012, 0.012, tray.width * 0.46, 16]} />
        <meshStandardMaterial {...surface.chrome} />
      </mesh>

      <SideStickers
        shapes={stickers.shapes}
        asterisk={stickers.asterisk}
        ship={stickers.ship}
      />
    </group>
  );
}

function SideStickers({
  shapes,
  asterisk,
  ship,
}: {
  shapes: Texture;
  asterisk: Texture;
  ship: Texture;
}) {
  const x = body.width / 2 + 0.04;
  const stickers = [
    { map: shapes, y: 0.64, z: 0.04, width: 0.26, height: 0.26 },
    { map: ship, y: 0.4, z: 0.04, width: 0.34, height: 0.15 },
    { map: asterisk, y: 0.16, z: 0.04, width: 0.22, height: 0.22 },
  ];
  return (
    <group>
      {stickers.map((sticker) => (
        <mesh
          key={sticker.y}
          position={[x, sticker.y, sticker.z]}
          rotation={[0, 0.72, 0]}
        >
          <planeGeometry args={[sticker.width, sticker.height]} />
          <meshStandardMaterial
            map={sticker.map}
            transparent
            roughness={0.55}
            metalness={0.02}
            polygonOffset
            polygonOffsetFactor={-2}
          />
        </mesh>
      ))}
    </group>
  );
}
