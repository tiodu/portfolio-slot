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
    (onChange) => subscribe("(max-width: 480px)", onChange),
    () => window.matchMedia("(max-width: 480px)").matches,
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
