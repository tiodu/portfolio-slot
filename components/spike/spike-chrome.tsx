"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { getPhase, requestSpin, subscribePhase } from "@/lib/spike/bus";
import { useReducedMotion } from "@/lib/spike/use-motion";

export function SpikeChrome({
  variant,
  ready,
  scriptClassName,
  children,
}: {
  variant: "procedural" | "modelled";
  ready: boolean;
  scriptClassName: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const phase = useSyncExternalStore(subscribePhase, getPhase, () => "idle" as const);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("a, button, input, textarea, select")
      ) {
        return;
      }
      event.preventDefault();
      requestSpin();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const status = !ready
    ? "Loading cabinet."
    : phase === "spinning"
      ? "Reels spinning."
      : phase === "landed"
        ? "Reels stopped."
        : "";

  return (
    <div className="spike">
      <span className={`spike-font-loader ${scriptClassName}`} aria-hidden="true">
        Eduardo
      </span>
      <div className="spike-bar">
        <div>
          <p className="spike-kicker">Spike — do not merge</p>
          <p className="spike-note">
            Procedural mesh and a generated GLB, side by side. No credits, no
            operator branding.
          </p>
        </div>
        <div className="spike-actions">
          <nav className="spike-nav" aria-label="Cabinet versions">
            <Link
              href="/spike/procedural"
              aria-current={variant === "procedural" ? "page" : undefined}
            >
              Procedural
            </Link>
            <Link
              href="/spike/modelled"
              aria-current={variant === "modelled" ? "page" : undefined}
            >
              Modelled
            </Link>
          </nav>
          <button type="button" onClick={() => requestSpin()} disabled={!ready}>
            Spin
          </button>
        </div>
      </div>
      <p className="spike-live" aria-live="polite">
        {status}
      </p>
      {children}
      <p className="spike-hint">
        Click the lever or press Space. Reduced motion snaps the reels and
        holds the bulbs steady.
        {reduced ? " Reduced motion is on." : ""}
      </p>
    </div>
  );
}
