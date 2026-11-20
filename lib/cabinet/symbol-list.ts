/**
 * Placeholder reel symbols. The drawings are temporary; swap the art later
 * and keep this list as the source of names.
 * Cherry, seven, star, and BAR are fillers for a mixed result.
 * BAR stays on the strip so the third reel can be checked upright.
 */
export type ReelSymbol = {
  id: string;
  label: string;
  /** What the reel paints until the real icon exists. */
  mark: "cherry" | "seven" | "star" | "bar" | "letter";
  /** Present when three of this symbol open a case study. */
  slug?: string;
};

export const reelSymbols: readonly ReelSymbol[] = [
  {
    id: "wa-fantasy-pickem",
    label: "Pick'em",
    mark: "letter",
    slug: "pickem",
  },
  {
    id: "wa-belloa-design-system",
    label: "Belloa",
    mark: "letter",
    slug: "belloa-ds",
  },
  {
    id: "roadready",
    label: "RoadReady",
    mark: "letter",
    slug: "roadready",
  },
  {
    id: "free-to-play-fantasy-games-library",
    label: "Library",
    mark: "letter",
    slug: "f2p-library",
  },
  {
    id: "belloa-back-office-redesign",
    label: "Office",
    mark: "letter",
    slug: "back-office",
  },
  { id: "cherry", label: "Cherry", mark: "cherry" },
  { id: "seven", label: "Seven", mark: "seven" },
  { id: "star", label: "Star", mark: "star" },
  { id: "bar", label: "BAR", mark: "bar" },
];

export const FACE_COUNT = reelSymbols.length;

export function symbolIndex(id: string) {
  const index = reelSymbols.findIndex((symbol) => symbol.id === id);
  if (index < 0) throw new Error(`Unknown reel symbol ${id}`);
  return index;
}

/** Idle window, left to right: cherry, star, BAR. */
export const idleFaces: readonly [number, number, number] = [
  symbolIndex("cherry"),
  symbolIndex("star"),
  symbolIndex("bar"),
];
