"use client";

import { Bounds, Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const MODEL = "/models/cabinet.glb";
const REQUIRED = ["Reel0", "Reel1", "Reel2", "LeverPivot", "TopperAnchor", "Sticker_Figma", "Sticker_Claude", "Sticker_ShipIt"];

type Report = { found: Record<string, boolean>; bulbs: number; triangles: number; meshes: number };

function Cabinet({ spin, onReport }: { spin: boolean; onReport: (r: Report) => void }) {
  const gltf = useGLTF(MODEL);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  // Parts the code drives, kept in a ref so the frame loop can move them.
  // Bulbs get their own material so each can glow on its own.
  const parts = useRef<{ reels: (THREE.Object3D | undefined)[]; lever?: THREE.Object3D; bulbs: THREE.Mesh[] }>({ reels: [], bulbs: [] });
  useEffect(() => {
    const reels = [0, 1, 2].map((i) => scene.getObjectByName(`Reel${i}`));
    const lever = scene.getObjectByName("LeverPivot");
    const bulbs: THREE.Mesh[] = [];
    scene.traverse((o) => {
      if (/^Bulb\d\d$/.test(o.name) && (o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        mesh.material = (mesh.material as THREE.Material).clone();
        bulbs.push(mesh);
      }
    });
    bulbs.sort((a, b) => a.name.localeCompare(b.name));
    parts.current = { reels, lever, bulbs };

    const found: Record<string, boolean> = {};
    for (const name of REQUIRED) found[name] = Boolean(scene.getObjectByName(name));
    let triangles = 0;
    let meshes = 0;
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      meshes += 1;
      const index = mesh.geometry.index;
      triangles += (index ? index.count : mesh.geometry.attributes.position.count) / 3;
    });
    onReport({ found, bulbs: bulbs.length, triangles: Math.round(triangles), meshes });
  }, [scene, onReport]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const { reels, lever, bulbs } = parts.current;
    bulbs.forEach((bulb, i) => {
      const material = bulb.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = spin ? 0.4 + 2.2 * Math.max(0, Math.sin(t * 6 - i * 0.5)) : 1.2;
    });
    if (!spin) return;
    // Reel0 to Reel2 only. ReelShade stays still so the edge shading does not spin with the glyphs.
    reels.forEach((reel, i) => {
      if (reel) reel.rotation.x = t * (4 + i);
    });
    if (lever) lever.rotation.x = Math.max(0, Math.sin(t * 1.5)) * 0.6;
  });

  return <primitive object={scene} />;
}

// Procedural studio lights, so chrome has something to reflect and nothing is fetched from a CDN.
function Studio() {
  return (
    <Environment resolution={256} background={false}>
      <Lightformer form="rect" intensity={4} position={[0, 3, 2]} scale={[6, 2, 1]} />
      <Lightformer form="rect" intensity={2.5} position={[-4, 1, 1]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
      <Lightformer form="rect" intensity={2.5} position={[4, 1, 1]} rotation-y={-Math.PI / 2} scale={[4, 3, 1]} />
      <Lightformer form="rect" intensity={1.5} position={[0, -2, 3]} scale={[6, 1, 1]} color="#ffb070" />
      <Lightformer form="ring" intensity={2} position={[0, 0.5, 4]} scale={3} color="#ffffff" />
    </Environment>
  );
}

export function GlbTest() {
  const [spin, setSpin] = useState(true);
  const [report, setReport] = useState<Report | null>(null);

  return (
    <main style={{ position: "fixed", inset: 0, background: "#0b0a12", color: "#f3efe6", fontFamily: "var(--font-outfit, system-ui)" }}>
      <Canvas
        camera={{ fov: 30, near: 0.01, far: 50, position: [0.6, 0.45, 2.2] }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Studio />
          <Bounds fit clip observe margin={1.15}>
            <Cabinet spin={spin} onReport={setReport} />
          </Bounds>
        </Suspense>
        <OrbitControls makeDefault enablePan={false} target={[0, 0.33, 0]} />
      </Canvas>
      <aside
        style={{ position: "absolute", left: 12, top: 12, padding: "10px 12px", background: "rgba(0,0,0,0.6)", borderRadius: 8, fontSize: 13, lineHeight: 1.5, maxWidth: 260 }}
        aria-live="polite"
      >
        <strong>Cabinet GLB test</strong>
        <div>{report ? `${report.meshes} meshes, ${report.triangles.toLocaleString("en-GB")} triangles, ${report.bulbs} bulbs` : "Loading model…"}</div>
        {report && (
          <ul style={{ listStyle: "none", margin: "6px 0", padding: 0 }}>
            {REQUIRED.map((name) => (
              <li key={name}>
                {report.found[name] ? "✓" : "✗"} {name}
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={() => setSpin((s) => !s)} style={{ padding: "4px 10px" }}>
          {spin ? "Stop motion" : "Drive reels, lever, bulbs"}
        </button>
      </aside>
    </main>
  );
}

useGLTF.preload(MODEL);
