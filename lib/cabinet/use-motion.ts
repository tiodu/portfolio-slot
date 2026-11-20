"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string, onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => subscribe("(prefers-reduced-motion: reduce)", onChange),
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function useCompactViewport() {
  return useSyncExternalStore(
    (onChange) => subscribe("(max-width: 30rem)", onChange),
    () => window.matchMedia("(max-width: 30rem)").matches,
    () => false,
  );
}

export function usePixelRatio(compact: boolean) {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("resize", onChange);
      return () => window.removeEventListener("resize", onChange);
    },
    () => {
      const cap = compact ? 1.25 : 1.75;
      return Math.min(window.devicePixelRatio || 1, cap);
    },
    () => 1,
  );
}

let webglSupport: boolean | null = null;

export function supportedWebGL() {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    webglSupport = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

let lowPower: boolean | null = null;

/** Heuristic for devices that should keep the CSS street plate instead of the strip shader. */
export function isLowPowerDevice() {
  if (lowPower !== null) return lowPower;
  try {
    const nav = navigator as NavigatorHints;
    if (nav.connection?.saveData) {
      lowPower = true;
      return lowPower;
    }
    if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) {
      lowPower = true;
      return lowPower;
    }
    if (nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 2) {
      lowPower = true;
      return lowPower;
    }
    lowPower = false;
  } catch {
    lowPower = false;
  }
  return lowPower;
}
