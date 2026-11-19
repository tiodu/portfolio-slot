"use client";

import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import { getPhase, subscribePhase } from "@/lib/spike/bus";
import { useReducedMotion } from "@/lib/spike/use-motion";
import { CabinetStill } from "./cabinet-still";
import { SpikeChrome } from "./spike-chrome";

const ModelledScene = dynamic(
  () => import("./modelled-scene").then((mod) => mod.ModelledScene),
  { ssr: false, loading: () => <CabinetStill /> },
);

export function ModelledStage({
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
    <SpikeChrome variant="modelled" ready={ready} scriptClassName={scriptClassName}>
      <div
        className="spike-scene"
        role="application"
        tabIndex={0}
        aria-label="Modelled three-reel cabinet. Press Space to spin the reels."
        data-variant="modelled"
        data-ready={ready ? "true" : "false"}
        data-phase={phase}
        data-reduced={reduced ? "true" : "false"}
        data-chase={reduced ? "off" : "on"}
      >
        {ready ? null : <CabinetStill scriptClassName={scriptClassName} />}
        <ModelledScene
          scriptFamily={scriptFamily}
          onReady={() => setReady(true)}
        />
      </div>
    </SpikeChrome>
  );
}
