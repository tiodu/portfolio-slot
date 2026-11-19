export type Phase = "idle" | "spinning" | "landed";

let phase: Phase = "idle";
const phaseListeners = new Set<() => void>();
const spinListeners = new Set<() => void>();

export function getPhase(): Phase {
  return phase;
}

export function setPhase(next: Phase) {
  if (phase === next) return;
  phase = next;
  phaseListeners.forEach((listener) => listener());
}

export function subscribePhase(listener: () => void) {
  phaseListeners.add(listener);
  return () => {
    phaseListeners.delete(listener);
  };
}

export function requestSpin() {
  spinListeners.forEach((listener) => listener());
}

export function onSpinRequested(listener: () => void) {
  spinListeners.add(listener);
  return () => {
    spinListeners.delete(listener);
  };
}
