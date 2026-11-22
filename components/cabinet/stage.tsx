"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  getCabinet,
  requestDismiss,
  requestSpin,
  setLeverDrag,
  subscribeCabinet,
} from "@/lib/cabinet/bus";
import { supportedWebGL, useReducedMotion } from "@/lib/cabinet/use-motion";
import { ResultCard } from "./result-card";

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

const PULL_PX = 72;

export function CabinetStage() {
  const reduced = useReducedMotion();
  const cabinet = useSyncExternalStore(subscribeCabinet, getCabinet, getCabinet);
  const webgl = useSyncExternalStore(subscribeOnce, supportedWebGL, () => false);
  const capture = useSyncExternalStore(
    subscribeOnce,
    () => new URLSearchParams(window.location.search).get("capture") === "1",
    () => false,
  );
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const leverRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number } | null>(null);
  const dragged = useRef(false);
  const markReady = useCallback(() => setReady(true), []);
  const markFailed = useCallback(() => setFailed(true), []);
  const showScene = webgl && !failed;
  if (!showScene && ready) setReady(false);
  const live = ready && showScene;
  const { phase, result, announcement } = cabinet;

  useEffect(() => {
    if (phase !== "landed") return;
    cardRef.current?.focus({ preventScroll: true });
  }, [phase, result?.key]);

  useEffect(() => {
    if (!live) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && getCabinet().phase === "landed") {
        event.preventDefault();
        requestDismiss();
        leverRef.current?.focus({ preventScroll: true });
        return;
      }
      if (event.code !== "Space" || event.repeat) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("a, button, input, textarea, select, .spin-result")
      ) {
        return;
      }
      if (getCabinet().phase !== "idle") {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      requestSpin();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [live]);

  const closeResult = () => {
    requestDismiss();
    leverRef.current?.focus({ preventScroll: true });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (getCabinet().phase !== "idle" || reduced) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { y: event.clientY };
    setLeverDrag(0);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag.current || reduced) return;
    const dy = event.clientY - drag.current.y;
    setLeverDrag(Math.max(0, dy / 110));
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    const dy = event.clientY - drag.current.y;
    drag.current = null;
    dragged.current = Math.abs(dy) > 12;
    setLeverDrag(null);
    if (dy > PULL_PX) requestSpin();
  };

  const onClick = () => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    if (getCabinet().phase !== "idle") return;
    requestSpin();
  };

  const spoken =
    announcement || (live ? "Pull the lever or press Space to spin." : "");

  return (
    <div
      className="cabinet"
      data-live={live ? "true" : "false"}
      data-reduced={reduced ? "true" : "false"}
      data-webgl={webgl ? "true" : "false"}
      data-capture={capture ? "true" : "false"}
      data-phase={phase}
    >
      {showScene ? (
        <SceneBoundary onFail={markFailed}>
          <div className="cabinet-scene" data-phase={phase}>
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
        width={807}
        height={1210}
        decoding="async"
        fetchPriority="high"
        aria-hidden={live ? true : undefined}
      />
      {live ? (
        <button
          ref={leverRef}
          type="button"
          className="lever-trigger"
          aria-label="Pull the lever"
          aria-disabled={phase !== "idle"}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onClick}
        />
      ) : null}
      {result && phase === "landed" && result.kind !== "study" ? (
        <ResultCard result={result} cardRef={cardRef} onClose={closeResult} />
      ) : null}
      <p className="sr-only" aria-live="polite">
        {spoken}
      </p>
    </div>
  );
}
