import { getCaseStudy } from "../case-studies";
import { reelSymbols, type ReelSymbol } from "./symbol-list";

export type Faces = [number, number, number];

export type Outcome =
  | {
      kind: "study";
      slug: string;
      title: string;
      summary: string;
      faces: Faces;
    }
  | {
      kind: "mixed";
      faces: Faces;
    };

function isStudyMatch(faces: Faces) {
  const symbol = reelSymbols[faces[0]];
  return Boolean(
    symbol?.slug && faces[1] === faces[0] && faces[2] === faces[0],
  );
}

function mixedFaces(random: () => number): Faces {
  const count = reelSymbols.length;
  let faces: Faces = [0, 0, 0];
  do {
    faces = [
      Math.floor(random() * count),
      Math.floor(random() * count),
      Math.floor(random() * count),
    ];
  } while (isStudyMatch(faces));
  return faces;
}

function studyOutcome(symbol: ReelSymbol, face: number): Outcome {
  const study = symbol.slug ? getCaseStudy(symbol.slug) : undefined;
  return {
    kind: "study",
    slug: symbol.slug ?? "",
    title: study?.title ?? symbol.label,
    summary: study?.summary ?? "[TODO]",
    faces: [face, face, face],
  };
}

/**
 * Pick the result first. One of the five case studies, or a mixed result.
 * The reels are then told to land on those faces. Nothing is weighted
 * towards a near-miss.
 */
export function pickOutcome(random: () => number = Math.random): Outcome {
  const studies = reelSymbols
    .map((symbol, index) => ({ symbol, index }))
    .filter((entry) => entry.symbol.slug);
  const roll = Math.floor(random() * (studies.length + 1));
  if (roll < studies.length) {
    const chosen = studies[roll];
    return studyOutcome(chosen.symbol, chosen.index);
  }
  return { kind: "mixed", faces: mixedFaces(random) };
}
