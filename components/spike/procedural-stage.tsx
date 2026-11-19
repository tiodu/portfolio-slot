"use client";

import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import { getPhase, subscribePhase } from "@/lib/spike/bus";
import { useReducedMotion } from "@/lib/spike/use-motion";
import { CabinetStill } from "./cabinet-still";
import { SpikeChrome } from "./spike-chrome";

const ProceduralScene = dynamic(
  () => import("./procedural-scene").then((mod) => mod.ProceduralScene),
  { ssr: false, loading: () => <CabinetStill /> },
);

export function ProceduralStage({
  scriptFamily,
  scriptClassName,
}: {
  scriptFamily: string;
  scriptClassName: string;
}) {
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  const phase = useSyncExternalStore(subscribePhase, getPhase, () => "idle" as const);

  return (
    <SpikeChrome variant="procedural" ready={ready} scriptClassName={scriptClassName}>
      <div
        className="spike-scene"
        role="application"
        tabIndex={0}
        aria-label="Procedural three-reel cabinet. Press Space to spin the reels."
        data-variant="procedural"
        data-ready={ready ? "true" : "false"}
        data-phase={phase}
        data-reduced={reduced ? "true" : "false"}
        data-chase={reduced ? "off" : "on"}
      >
        {ready ? null : <CabinetStill scriptClassName={scriptClassName} />}
        <ProceduralScene
          scriptFamily={scriptFamily}
          onReady={() => setReady(true)}
        />
      </div>
    </SpikeChrome>
  );
}
