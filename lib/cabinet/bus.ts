import type { Outcome } from "./outcome";
import type { Phase } from "./machine";

export type ResultCard = {
  key: number;
  kind: Outcome["kind"];
  title: string;
  body: string;
  href?: string;
};

export type CabinetSnapshot = {
  phase: Phase;
  result: ResultCard | null;
  announcement: string;
};

let key = 0;
let snapshot: CabinetSnapshot = {
  phase: "idle",
  result: null,
  announcement: "",
};

const listeners = new Set<() => void>();
const spinListeners = new Set<() => void>();
const dismissListeners = new Set<() => void>();

let leverDrag: number | null = null;

function emit(next: CabinetSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function getCabinet(): CabinetSnapshot {
  return snapshot;
}

export function subscribeCabinet(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setPhase(phase: Phase) {
  if (snapshot.phase === phase) return;
  emit({ ...snapshot, phase });
}

export function setAnnouncement(announcement: string) {
  if (snapshot.announcement === announcement) return;
  emit({ ...snapshot, announcement });
}

export function publishResult(outcome: Outcome) {
  key += 1;
  const result: ResultCard =
    outcome.kind === "study"
      ? {
          key,
          kind: "study",
          title: outcome.title,
          body: outcome.summary,
          href: `/work/${outcome.slug}`,
        }
      : {
          key,
          kind: "mixed",
          title: "Mixed result",
          body: "[TODO] A short note belongs here.",
        };
  const announcement =
    outcome.kind === "study"
      ? `Three ${outcome.title}. Open the case study.`
      : "Mixed result. [TODO] A short note belongs here.";
  emit({ ...snapshot, phase: "landed", result, announcement });
}

export function clearResult() {
  if (!snapshot.result && snapshot.phase === "idle") return;
  emit({ ...snapshot, phase: "idle", result: null });
}

export function requestSpin() {
  if (snapshot.phase !== "idle") return;
  spinListeners.forEach((listener) => listener());
}

export function onSpinRequested(listener: () => void) {
  spinListeners.add(listener);
  return () => {
    spinListeners.delete(listener);
  };
}

export function requestDismiss() {
  if (snapshot.phase !== "landed") return;
  dismissListeners.forEach((listener) => listener());
}

export function onDismissRequested(listener: () => void) {
  dismissListeners.add(listener);
  return () => {
    dismissListeners.delete(listener);
  };
}

export function setLeverDrag(amount: number | null) {
  leverDrag = amount;
}

export function readLeverDrag() {
  return leverDrag;
}

export function resetCabinet() {
  key = 0;
  leverDrag = null;
  snapshot = { phase: "idle", result: null, announcement: "" };
}
