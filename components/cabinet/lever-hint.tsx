"use client";

import { useSyncExternalStore } from "react";
import { getCabinet, subscribeCabinet } from "@/lib/cabinet/bus";
import { useIdle } from "@/lib/use-idle";

const IDLE_MS = 4000;

/**
 * Decorative text, so it is aria-hidden and never announced. It shows after 4 s of
 * quiet while the machine is at rest, and starts its wait again when a spin ends.
 * CSS only shows it once the live cabinet is ready (a sibling `.cabinet[data-live]`).
 */
export function LeverHint() {
  const { phase } = useSyncExternalStore(subscribeCabinet, getCabinet, getCabinet);
  const idle = useIdle(IDLE_MS, phase);
  return (
    <p className="lever-hint" aria-hidden="true" data-visible={idle && phase === "idle"}>
      pull the lever or press space
    </p>
  );
}
