"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, SelectiveBloom } from "@react-three/postprocessing";
import {
  createContext,
  use,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import * as THREE from "three";
import { onSpinRequested, setPhase } from "@/lib/cabinet/bus";
import { frame, plinth } from "@/lib/cabinet/metrics";
import {
  beginSpin,
  createRig,
  stepRig,
  type Rig,
} from "@/lib/cabinet/rig";
import { createShadowTexture } from "@/lib/cabinet/symbols";

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
      invalidate();
    });
  }, [invalidate, rig]);

  useEffect(() => {
    return () => setPhase("idle");
  }, []);

  useFrame((_, delta) => {
    const previous = rig.current.phase;
    const moving = stepRig(rig.current, performance.now(), reducedRef.current, delta);
    if (rig.current.phase !== previous) setPhase(rig.current.phase);
    if (moving) invalidate();
  });

  return null;
}

function FrameCamera() {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = size.width / Math.max(1, size.height);
    const fov = (frame.fov * Math.PI) / 180;
    const distanceForHeight = frame.height / 2 / Math.tan(fov / 2);
    const horizontalFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
    const distanceForWidth = frame.width / 2 / Math.tan(horizontalFov / 2);
    const distance = Math.max(distanceForHeight, distanceForWidth) * 1.03;
    // The camera is a Three.js object. Fitting it is a mutation, not React state.
    // eslint-disable-next-line react-hooks/immutability
    camera.fov = frame.fov;
    camera.position.set(frame.yaw, frame.targetY, distance);
    camera.lookAt(0, frame.targetY, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

function Stage({ children }: { children: ReactNode }) {
  const scene = useThree((state) => state.scene);
  const shadow = useMemo(() => createShadowTexture(), []);

  useLayoutEffect(() => {
    // Keep the canvas clear so the street image shows through the scene.
    // eslint-disable-next-line react-hooks/immutability
    scene.background = null;
    return () => {
      shadow.dispose();
    };
  }, [scene, shadow]);

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, plinth.y - plinth.height / 2 - 0.01, 0.1]}
      >
        <planeGeometry args={[3.2, 1.6]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
      {children}
    </>
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
    if (waits.current < 4) {
      invalidate();
      return;
    }
    done.current = true;
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
      <Environment frames={1} resolution={128} environmentIntensity={0.95}>
        <Lightformer
          form="rect"
          intensity={3.4}
          color="#fff3e4"
          position={[0, 2.2, 3.4]}
          scale={[6, 2.4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.6}
          color="#ffffff"
          position={[0.1, 0.45, 3.5]}
          scale={[2.4, 0.28, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#ffffff"
          position={[0.2, -0.55, 2.8]}
          scale={[2.4, 0.7, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#ff4d6a"
          position={[-3.4, 0.8, 1.2]}
          scale={[1.2, 3.6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          color="#9eb6d4"
          position={[3.2, 0.4, -1.6]}
          scale={[2, 2.2, 1]}
        />
        <Lightformer
          form="circle"
          intensity={2.4}
          color="#ffb15a"
          position={[0.1, 2.6, 1.4]}
          scale={[1.4, 1.4, 1]}
        />
      </Environment>
      <ambientLight intensity={0.16} />
      <directionalLight
        ref={key}
        position={[1.8, 3.4, 4.4]}
        intensity={2.4}
        color="#fff4e8"
      />
      <directionalLight position={[3.1, 0.8, 2.6]} intensity={0.7} color="#b6fff6" />
      <directionalLight position={[-2.8, 1.2, 2.4]} intensity={0.28} color="#ffd0ea" />
      <Stage>{children}</Stage>
      {targets.length > 0 ? (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <SelectiveBloom
            selection={targets}
            lights={lights}
            intensity={compact ? 1 : 1.55}
            luminanceThreshold={0.16}
            luminanceSmoothing={0.2}
            mipmapBlur
            radius={0.48}
            levels={5}
            resolutionScale={compact ? 0.5 : 0.72}
            ignoreBackground
          />
        </EffectComposer>
      ) : null}
      <FirstFrame readyToShow={readyToShow} onReady={onReady} />
    </RigContext>
  );
}
