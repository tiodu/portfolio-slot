"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { getCabinet, subscribeCabinet } from "@/lib/cabinet/bus";
import { useReducedMotion } from "@/lib/cabinet/use-motion";
import { studyFadeTypes } from "@/lib/study-fade";
import {
  holdZoom,
  playZoom,
  readZoom,
  resetZoom,
  skipZoom,
  subscribeZoom,
} from "@/lib/zoom/store";
import { PAGE_START_T, zoomFrame } from "@/lib/zoom/timeline";

/*
  History marks. Next owns history.state, so the marks are merged into it and
  copied to sessionStorage under the same entry key as a fallback.
  - "left": the home entry we left by zoom (Back should reverse the zoom)
  - "arrived": the study entry we reached by zoom (Forward should replay the arrival)
*/
type Mark = "left" | "arrived";

function entryKey() {
  const id = (history.state as { zoomId?: unknown } | null)?.zoomId;
  return typeof id === "string" ? id : `${location.pathname}|${history.length}`;
}

function markEntry(mark: Mark) {
  const zoomId = entryKey();
  history.replaceState({ ...history.state, zoomId, [mark]: "zoom" }, "");
  try {
    sessionStorage.setItem(`zoom:${zoomId}:${mark}`, "1");
  } catch {}
}

function hasMark(mark: Mark) {
  if ((history.state as Record<string, unknown> | null)?.[mark] === "zoom") return true;
  try {
    return sessionStorage.getItem(`zoom:${entryKey()}:${mark}`) === "1";
  } catch {
    return false;
  }
}

/** The target may not exist yet (the scene loads late), so retry for a few seconds. */
function focusWhenThere(find: () => HTMLElement | null) {
  const until = performance.now() + 6000;
  const attempt = () => {
    const target = find();
    if (target) target.focus({ preventScroll: true });
    else if (performance.now() < until) setTimeout(attempt, 100);
  };
  attempt();
}

const isStudy = (path: string) => path.startsWith("/work/");

/**
 * Plays the zoom transition and owns everything around it: the dim veil, the
 * page fade variable, skip, history marks and focus. The camera reads the same
 * progress in `world.tsx`. It only listens to the landed state; it never drives it.
 */
export function ZoomLayer() {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const cabinet = useSyncExternalStore(subscribeCabinet, getCabinet, getCabinet);
  const veil = useRef<HTMLDivElement>(null);
  const pathRef = useRef(pathname);
  const pending = useRef<string | null>(null);
  const armed = useRef(false);
  const popped = useRef(false);
  const reversing = useRef(false);
  const swallowClick = useRef(false);

  // Paint every progress change straight to the DOM, with no React render per frame.
  useEffect(() => {
    const apply = () => {
      const { t, dir } = readZoom();
      const frame = zoomFrame(t);
      const active = t > 0 || dir !== 0;
      const el = veil.current;
      if (el) {
        el.style.opacity = String(frame.dim);
        el.style.visibility = active ? "visible" : "hidden";
      }
      const root = document.documentElement;
      if (active) root.style.setProperty("--zoom-page", String(frame.page));
      else root.style.removeProperty("--zoom-page");

      if (pending.current && t >= PAGE_START_T) {
        const href = pending.current;
        pending.current = null;
        markEntry("left");
        armed.current = true;
        router.push(href);
      }
      // Arrived: the study page is mounted and fully up, so drop the veil.
      if (dir === 0 && t === 1 && !pending.current && !armed.current && isStudy(pathRef.current)) {
        resetZoom();
        return;
      }
      if (dir === 0 && t === 0 && reversing.current) {
        reversing.current = false;
        focusWhenThere(() => document.querySelector<HTMLElement>(".lever-trigger"));
      }
    };
    apply();
    return subscribeZoom(apply);
  }, [router]);

  // Any click or key skips, except Tab. Back during a zoom skips to the end of the reverse.
  useEffect(() => {
    const skip = (event: Event) => {
      if (readZoom().dir === 0) return;
      event.preventDefault();
      skipZoom();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") skip(event);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (readZoom().dir === 0) return;
      swallowClick.current = true;
      skip(event);
    };
    const onClick = (event: MouseEvent) => {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    };
    const onPopState = () => {
      popped.current = true;
      // Hold the dark frame now so the old page never flashes before the zoom plays.
      if (hasMark("left") || hasMark("arrived")) holdZoom(PAGE_START_T);
    };
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  // Route changes: finish our own push, or answer Back and Forward.
  useEffect(() => {
    const previous = pathRef.current;
    if (previous === pathname) return;
    pathRef.current = pathname;

    if (armed.current) {
      armed.current = false;
      markEntry("arrived");
      const { t, dir } = readZoom();
      if (dir === 0 && t === 1) resetZoom();
      return;
    }
    if (!popped.current) return;
    popped.current = false;

    if (pathname === "/" && readZoom().t === PAGE_START_T) {
      // Back from a zoom arrival. The study page is already gone, so this plays
      // the camera and the dim in reverse; the page fade-out is not replayed.
      reversing.current = true;
      playZoom(-1, PAGE_START_T);
    } else if (isStudy(pathname) && readZoom().t === PAGE_START_T) {
      playZoom(1, PAGE_START_T);
    } else if (pathname === "/" && isStudy(previous)) {
      focusWhenThere(() => document.querySelector<HTMLElement>(`a[href="${previous}"]`));
    }
  }, [pathname]);

  // A study landed: zoom in, or crossfade when reduced motion is on.
  const landedStudy =
    cabinet.phase === "landed" && cabinet.result?.kind === "study" ? cabinet.result : null;
  const landedKey = landedStudy?.key;
  const landedHref = landedStudy?.href;
  useEffect(() => {
    if (!landedHref) return;
    router.prefetch(landedHref);
    if (reduced) {
      router.push(landedHref, { transitionTypes: [...studyFadeTypes] });
      return;
    }
    pending.current = landedHref;
    playZoom(1);
  }, [landedKey, landedHref, reduced, router]);

  return <div ref={veil} className="zoom-veil" aria-hidden="true" />;
}
