"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/cabinet/use-motion";

const MAX_X = 14;
const MAX_Y = 8;
const EASE = 0.08;

/**
 * Moves its children a few pixels against the pointer. The layer chases the pointer
 * with a lerp (each frame it closes a fraction of the gap), so it glides instead of snapping.
 * The loop stops once it has settled. Off under reduced motion.
 */
export function ParallaxLayer({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = layer.current;
    if (reduced || !element) return;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let frame = 0;
    const tick = () => {
      x += (tx - x) * EASE;
      y += (ty - y) * EASE;
      element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(1.04)`;
      frame =
        Math.abs(tx - x) < 0.02 && Math.abs(ty - y) < 0.02 ? 0 : requestAnimationFrame(tick);
    };
    const onMove = (event: PointerEvent) => {
      tx = -(event.clientX / window.innerWidth - 0.5) * 2 * MAX_X;
      ty = -(event.clientY / window.innerHeight - 0.5) * 2 * MAX_Y;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
      element.style.transform = "";
    };
  }, [reduced]);

  return (
    <div ref={layer} className="hero-parallax">
      {children}
    </div>
  );
}
