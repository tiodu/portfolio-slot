"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import dynamic from "next/dynamic";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import * as THREE from "three";
import {
  STRIP_IMAGE,
  STRIP_IMAGE_SIZE,
  stripDefaults,
  stripFragmentShader,
  stripVertexShader,
  type StripControls,
} from "@/lib/cabinet/strip-shader";
import {
  isLowPowerDevice,
  supportedWebGL,
  useReducedMotion,
} from "@/lib/cabinet/use-motion";

function subscribeOnce() {
  return () => {};
}

const StripDevPanel = dynamic(
  () => import("./strip-dev-panel").then((mod) => mod.StripDevPanel),
  { ssr: false },
);

type BoundaryProps = {
  children: ReactNode;
  onFail: () => void;
};

class StripBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function StripPlane({
  reduced,
  controls,
}: {
  reduced: boolean;
  controls: StripControls;
}) {
  const texture = useLoader(THREE.TextureLoader, STRIP_IMAGE);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const controlsRef = useRef(controls);
  const { viewport, size, invalidate } = useThree();
  const tint = useMemo(() => new THREE.Color(controls.tint), [controls.tint]);

  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  useEffect(() => {
    // Texture setup is a Three.js mutation, not React state.
    // eslint-disable-next-line react-hooks/immutability
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    invalidate();
  }, [invalidate, texture]);

  const uniforms = useMemo(() => {
    const image = texture.image as { width?: number; height?: number } | undefined;
    return {
      uMap: { value: texture },
      uTime: { value: 0 },
      uHazeAmount: { value: controls.hazeAmount },
      uHazeSpeed: { value: controls.hazeSpeed },
      uSmearAmount: { value: controls.smearAmount },
      uTint: { value: tint.clone() },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uImageSize: {
        value: new THREE.Vector2(
          image?.width ?? STRIP_IMAGE_SIZE.width,
          image?.height ?? STRIP_IMAGE_SIZE.height,
        ),
      },
    };
    // Initial uniform bag; values are written each frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture]);

  useFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) return;
    const next = controlsRef.current;
    material.uniforms.uTime.value = reduced ? 0 : clock.elapsedTime;
    material.uniforms.uHazeAmount.value = next.hazeAmount;
    material.uniforms.uHazeSpeed.value = next.hazeSpeed;
    material.uniforms.uSmearAmount.value = next.smearAmount;
    material.uniforms.uTint.value.copy(tint);
    material.uniforms.uResolution.value.set(size.width, size.height);
  });

  useEffect(() => {
    invalidate();
  }, [controls, invalidate, reduced, size.height, size.width, tint]);

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={stripVertexShader}
        fragmentShader={stripFragmentShader}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function StripCanvas({
  reduced,
  controls,
}: {
  reduced: boolean;
  controls: StripControls;
}) {
  const gl = useMemo(
    () => ({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance" as const,
      stencil: false,
    }),
    [],
  );

  return (
    <Canvas
      className="hero-street-canvas"
      orthographic
      dpr={[1, 1.5]}
      frameloop={reduced ? "demand" : "always"}
      gl={gl}
      camera={{ position: [0, 0, 1], zoom: 100, near: 0.1, far: 10 }}
      style={{ background: "transparent" }}
      onCreated={({ gl: renderer, invalidate }) => {
        renderer.setClearColor(0x000000, 0);
        invalidate();
      }}
    >
      <Suspense fallback={null}>
        <StripPlane reduced={reduced} controls={controls} />
      </Suspense>
    </Canvas>
  );
}

export function StripBackground() {
  const reduced = useReducedMotion();
  const webgl = useSyncExternalStore(subscribeOnce, supportedWebGL, () => false);
  const lowPower = useSyncExternalStore(subscribeOnce, isLowPowerDevice, () => false);
  const tune = useSyncExternalStore(
    subscribeOnce,
    () => new URLSearchParams(window.location.search).has("tune"),
    () => false,
  );
  const [failed, setFailed] = useState(false);
  const [controls, setControls] = useState<StripControls>(stripDefaults);
  const markFailed = useCallback(() => setFailed(true), []);
  const onControls = useCallback((value: StripControls) => setControls(value), []);

  const useShader = webgl && !lowPower && !failed;
  const showPanel =
    useShader && (process.env.NODE_ENV === "development" || tune);

  return (
    <>
      {/* Static plate: low-power / no-WebGL fallback, and a stand-in while the shader loads. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="hero-street-fallback" src={STRIP_IMAGE} alt="" decoding="async" />
      {useShader ? (
        <StripBoundary onFail={markFailed}>
          <StripCanvas reduced={reduced} controls={controls} />
        </StripBoundary>
      ) : null}
      {showPanel ? <StripDevPanel onChange={onControls} /> : null}
    </>
  );
}
