"use client";

import { useEffect, useState } from "react";

const ACTIVITY = ["pointermove", "pointerdown", "keydown", "scroll", "wheel", "touchstart"] as const;

/**
 * Idle detection with a debounce timer: every sign of activity cancels the pending
 * timer and starts a new one, so "idle" only becomes true after `ms` of quiet.
 * `resetKey` restarts the wait from outside, for example when a spin ends.
 */
export function useIdle(ms: number, resetKey?: unknown) {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let timer = 0;
    const restart = () => {
      window.clearTimeout(timer);
      setIdle(false);
      timer = window.setTimeout(() => setIdle(true), ms);
    };
    restart();
    for (const type of ACTIVITY) {
      window.addEventListener(type, restart, { passive: true, capture: true });
    }
    return () => {
      window.clearTimeout(timer);
      for (const type of ACTIVITY) window.removeEventListener(type, restart, { capture: true });
    };
  }, [ms, resetKey]);

  return idle;
}
