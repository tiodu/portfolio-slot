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
import {
  clearResult,
  onDismissRequested,
  onSpinRequested,
  publishResult,
  readLeverDrag,
  setAnnouncement,
  setPhase,
} from "@/lib/cabinet/bus";
import {
  createMachine,
  dismiss,
  dragLever,
  pull,
  tick,
  type Machine,
} from "@/lib/cabinet/machine";
import { glbRequested, glbWindow } from "@/lib/cabinet/glb-metrics";
import { frame, plinth, reel, windowFrame } from "@/lib/cabinet/metrics";
import { pickOutcome } from "@/lib/cabinet/outcome";
import { createShadowTexture } from "@/lib/cabinet/symbols";
import { readZoom } from "@/lib/zoom/store";
import { zoomFrame } from "@/lib/zoom/timeline";

const RigContext = createContext<RefObject<Machine> | null>(null);

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
      const now = performance.now() / 1000;
      const outcome = pickOutcome();
      const started = pull(rig.current, now, outcome, reducedRef.current);
      if (!started) return;
      if (rig.current.phase === "landed") publishResult(outcome);
      else {
        setAnnouncement("Reels spinning.");
        setPhase(rig.current.phase);
      }
      invalidate();
    });
  }, [invalidate, rig]);

  useEffect(() => {
    return onDismissRequested(() => {
      if (!dismiss(rig.current)) return;
      clearResult();
      invalidate();
    });
  }, [invalidate, rig]);

  useEffect(() => {
    return () => {
      setPhase("idle");
      clearResult();
    };
  }, []);

  useFrame((_, delta) => {
    const now = performance.now() / 1000;
    const drag = readLeverDrag();
    if (drag === null) {
      if (rig.current.leverDragging) dragLever(rig.current, null);
    } else {
      dragLever(rig.current, drag);
    }
    const previous = rig.current.phase;
    const moving = tick(rig.current, now, delta, reducedRef.current);
    if (rig.current.phase !== previous) {
      if (rig.current.phase === "landed" && rig.current.outcome) {
        publishResult(rig.current.outcome);
      } else {
        setPhase(rig.current.phase);
      }
    }
    if (moving) invalidate();
  });

  return null;
}

type RestPose = { position: THREE.Vector3; target: THREE.Vector3; aspect: number };

function keepRest(pose: RestPose, position: THREE.Vector3, aspect: number) {
  pose.position.copy(position);
  pose.target.set(0, frame.targetY, 0);
  pose.aspect = aspect;
}

function FrameCamera({ rest }: { rest: RefObject<RestPose> }) {
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
    keepRest(rest.current, camera.position, aspect);
  }, [camera, size, rest]);

  return null;
}

/** Fraction of the window width that the reel window fills when the dolly reaches 1. */
const WINDOW_FILL = 0.92;
const WINDOW_CENTRE = new THREE.Vector3(0, reel.y, windowFrame.z);
const GLB_WINDOW_CENTRE = new THREE.Vector3(...glbWindow.centre);

/**
 * Reads the zoom progress and dollies the camera towards the reel window with a roll.
 * `zoomFrame` is the whole timeline; this only turns its numbers into a camera pose.
 */
function ZoomCamera({ rest }: { rest: RefObject<RestPose> }) {
  const camera = useThree((state) => state.camera);
  const lastT = useRef(0);
  const position = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const stop = useMemo(() => new THREE.Vector3(), []);
  const glbOn = useMemo(() => glbRequested(), []);
  const windowCentre = glbOn ? GLB_WINDOW_CENTRE : WINDOW_CENTRE;
  const windowWidth = glbOn ? glbWindow.innerWidth : windowFrame.innerWidth;

  useFrame(() => {
    const { t } = readZoom();
    if (t === lastT.current) return;
    lastT.current = t;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const { dolly, rollDeg } = zoomFrame(t);
    const pose = rest.current;
    const fov = (camera.fov * Math.PI) / 180;
    const horizontal = 2 * Math.atan(Math.tan(fov / 2) * pose.aspect);
    const close = windowWidth / WINDOW_FILL / 2 / Math.tan(horizontal / 2);
    // The camera stops `close` units from the window, on the line from rest to the window.
    stop.copy(pose.position).sub(windowCentre).setLength(close).add(windowCentre);
    position.copy(pose.position).lerp(stop, dolly);
    target.copy(pose.target).lerp(windowCentre, Math.min(1, dolly));
    camera.position.copy(position);
    camera.lookAt(target);
    camera.rotateZ((rollDeg * Math.PI) / 180);
  });

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
  const rig = useRef(createMachine());
  const rest = useRef<RestPose>({
    position: new THREE.Vector3(),
    target: new THREE.Vector3(),
    aspect: 1,
  });
  const key = useRef<THREE.DirectionalLight>(null);
  const lights = useMemo(() => [key], []);

  return (
    <RigContext value={rig}>
      <RigDriver reduced={reduced} />
      <FrameCamera rest={rest} />
      <ZoomCamera rest={rest} />
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
