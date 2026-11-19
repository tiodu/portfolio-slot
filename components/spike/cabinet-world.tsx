"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, SelectiveBloom } from "@react-three/postprocessing";
import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import * as THREE from "three";
import { setPhase } from "@/lib/spike/bus";
import { onSpinRequested } from "@/lib/spike/bus";
import { frame, plinth } from "@/lib/spike/metrics";
import {
  beginSpin,
  createRig,
  stepRig,
  stopList,
  type Rig,
} from "@/lib/spike/rig";
import { createShadowTexture, createVegasTexture } from "@/lib/spike/symbols";

const RigContext = createContext<RefObject<Rig> | null>(null);

export function useRig() {
  const rig = use(RigContext);
  if (!rig) throw new Error("Cabinet rig is missing");
  return rig;
}

function RigDriver({ reduced }: { reduced: boolean }) {
  const rig = useRig();
  const reducedRef = useRef(reduced);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  useEffect(() => {
    return onSpinRequested(() => {
      const started = beginSpin(rig.current, performance.now(), reducedRef.current);
      if (!started) return;
      setPhase(rig.current.phase);
      const root = document.querySelector(".spike-scene");
      if (root instanceof HTMLElement) root.dataset.stops = stopList(rig.current);
      invalidate();
    });
  }, [invalidate, rig]);

  useEffect(() => {
    const root = document.querySelector(".spike-scene");
    if (root instanceof HTMLElement) root.dataset.stops = stopList(rig.current);
    return () => setPhase("idle");
  }, [rig]);

  useFrame((_, delta) => {
    const previous = rig.current.phase;
    const moving = stepRig(rig.current, performance.now(), reducedRef.current, delta);
    if (rig.current.phase !== previous) {
      setPhase(rig.current.phase);
      const root = document.querySelector(".spike-scene");
      if (root instanceof HTMLElement) root.dataset.stops = stopList(rig.current);
    }
    if (moving) invalidate();
  });

  return null;
}

function FrameCamera() {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = size.width / Math.max(1, size.height);
    const fov = (frame.fov * Math.PI) / 180;
    const distanceForHeight = frame.height / 2 / Math.tan(fov / 2);
    const horizontalFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
    const distanceForWidth = frame.width / 2 / Math.tan(horizontalFov / 2);
    const distance = Math.max(distanceForHeight, distanceForWidth) * 1.06;
    // Three.js cameras are mutable scene objects, not React state.
    // eslint-disable-next-line react-hooks/immutability
    camera.fov = frame.fov;
    camera.position.set(aspect > 0.9 ? 0.62 : 0.32, frame.targetY + 0.12, distance);
    camera.lookAt(0, frame.targetY, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

function Backdrop() {
  const scene = useThree((state) => state.scene);
  const texture = useMemo(() => createVegasTexture(), []);
  const shadow = useMemo(() => createShadowTexture(), []);

  useEffect(() => {
    // The backdrop is a Three.js scene property, not React state.
    // eslint-disable-next-line react-hooks/immutability
    scene.background = texture;
    return () => {
      scene.background = null;
      texture.dispose();
      shadow.dispose();
    };
  }, [scene, shadow, texture]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, plinth.y - plinth.height / 2 + 0.01, 0.1]}
    >
      <planeGeometry args={[3.4, 1.8]} />
      <meshBasicMaterial map={shadow} transparent depthWrite={false} />
    </mesh>
  );
}

function FirstFrame({
  readyToShow,
  onReady,
}: {
  readyToShow: boolean;
  onReady: () => void;
}) {
  const done = useRef(false);
  const waits = useRef(0);
  const onReadyRef = useRef(onReady);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useFrame(() => {
    if (done.current) return;
    if (!readyToShow) {
      invalidate();
      return;
    }
    waits.current += 1;
    if (waits.current < 3) {
      invalidate();
      return;
    }
    done.current = true;
    performance.mark("cabinet-first-frame");
    onReadyRef.current();
  });

  return null;
}

export function CabinetWorld({
  children,
  reduced,
  compact,
  targets,
  readyToShow,
  onReady,
}: {
  children: ReactNode;
  reduced: boolean;
  compact: boolean;
  targets: THREE.Object3D[];
  readyToShow: boolean;
  onReady: () => void;
}) {
  const rig = useRef(createRig());
  const key = useRef<THREE.DirectionalLight>(null);
  const lights = useMemo(() => [key], []);

  return (
    <RigContext value={rig}>
      <RigDriver reduced={reduced} />
      <FrameCamera />
      <Backdrop />
      <Environment frames={1} resolution={128} environmentIntensity={0.82}>
        <Lightformer
          form="rect"
          intensity={3.2}
          color="#fff3e4"
          position={[0, 2.2, 3.2]}
          scale={[6, 2.6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.4}
          color="#ff4d6a"
          position={[-3.6, 0.8, 1]}
          scale={[1.4, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#3d7dff"
          position={[3.4, 0.2, -2]}
          scale={[2.2, 2.4, 1]}
        />
        <Lightformer
          form="circle"
          intensity={2.2}
          color="#ffb15a"
          position={[0.2, 2.8, 1.2]}
          scale={[1.6, 1.6, 1]}
        />
      </Environment>
      <ambientLight intensity={0.18} />
      <directionalLight
        ref={key}
        position={[2.2, 3.5, 4.2]}
        intensity={2.6}
        color="#fff4e8"
      />
      <directionalLight position={[-3.2, 1.1, 2.2]} intensity={0.45} color="#ffc0cb" />
      <directionalLight position={[0.2, 2.4, -3]} intensity={0.7} color="#b9d6ff" />
      {children}
      {targets.length > 0 ? (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <SelectiveBloom
            selection={targets}
            lights={lights}
            intensity={compact ? 0.75 : 1.2}
            luminanceThreshold={0.28}
            luminanceSmoothing={0.18}
            mipmapBlur
            radius={0.4}
            levels={5}
            resolutionScale={compact ? 0.45 : 0.7}
          />
        </EffectComposer>
      ) : null}
      <FirstFrame readyToShow={readyToShow} onReady={onReady} />
    </RigContext>
  );
}
