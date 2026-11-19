"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { getPhase, requestSpin, subscribePhase } from "@/lib/cabinet/bus";
import { supportedWebGL, useReducedMotion } from "@/lib/cabinet/use-motion";

function subscribeOnce() {
  return () => {};
}

const CabinetScene = dynamic(
  () => import("./scene").then((mod) => mod.CabinetScene),
  { ssr: false },
);

type BoundaryProps = {
  children: ReactNode;
  onFail: () => void;
};

class SceneBoundary extends Component<BoundaryProps, { failed: boolean }> {
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

export function CabinetStage() {
  const reduced = useReducedMotion();
  const phase = useSyncExternalStore(subscribePhase, getPhase, () => "idle" as const);
  const webgl = useSyncExternalStore(subscribeOnce, supportedWebGL, () => false);
  const capture = useSyncExternalStore(
    subscribeOnce,
    () => new URLSearchParams(window.location.search).get("capture") === "1",
    () => false,
  );
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  const markFailed = useCallback(() => setFailed(true), []);
  const showScene = webgl && !reduced && !failed;
  if (!showScene && ready) setReady(false);
  const live = ready && showScene;

  useEffect(() => {
    if (!showScene) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("a, button, input, textarea, select, summary")
      ) {
        return;
      }
      event.preventDefault();
      requestSpin();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showScene]);

  const status = !showScene
    ? ""
    : !ready
      ? "Loading cabinet."
      : phase === "spinning"
        ? "Reels spinning."
        : phase === "landed"
          ? "Reels stopped."
          : "Cabinet ready.";

  return (
    <div
      className="cabinet"
      data-live={live ? "true" : "false"}
      data-reduced={reduced ? "true" : "false"}
      data-webgl={webgl ? "true" : "false"}
      data-capture={capture ? "true" : "false"}
    >
      {showScene ? (
        <SceneBoundary onFail={markFailed}>
          <div
            className="cabinet-scene"
            role="application"
            tabIndex={0}
            aria-label="Three-reel cabinet. Press Space to spin the reels."
            data-phase={phase}
          >
            <CabinetScene capture={capture} onReady={markReady} />
          </div>
        </SceneBoundary>
      ) : null}
      {/* Captured from this same canvas. next/image would resample the frame. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="cabinet-still"
        src="/cabinet-still.webp"
        alt="A cream and turquoise Googie slot cabinet with a starburst sign reading Eduardo de Souza, three reels, and a lever."
        width={728}
        height={1092}
        decoding="async"
        fetchPriority="high"
        aria-hidden={live ? true : undefined}
      />
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
