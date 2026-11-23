/**
 * The swoosh and arrowhead under "de Souza", traced from the reference front render
 * (art/reference/unzipped/image 7.png, 1280x720, art/neon/arrow-trace.json).
 * The points are image pixels; `neonPoint` turns them into metres in the cabinet model.
 *
 * `ARROW_TUBE` is one continuous tube: a free end on the inner line, the left hairpin,
 * the outer line, the right hairpin, then the shaft down-left to the tip.
 */
export const ARROW_TUBE: ReadonlyArray<readonly [number, number]> = [
  [770, 270], [754, 271], [722, 275], [690, 280], [658, 286], [626, 294], [594, 303], [562, 312],
  [538, 316], [528, 315], [520, 310], [521, 304], [530, 300], [540, 298], [562, 292], [594, 283],
  [626, 276], [658, 270], [690, 265], [722, 260], [754, 258], [778, 257], [788, 258], [792, 264],
  [788, 270], [779, 275], [770, 280], [762, 284], [754, 289], [746, 294], [738, 299], [730, 306],
  [722, 314], [715, 322],
];

/** The arrowhead: end of the up barb, the tip, end of the right barb. */
export const ARROW_HEAD: ReadonlyArray<readonly [number, number]> = [
  [714, 287], [715, 323], [750, 310],
];

/** The reference camera frames the model at about this many pixels per metre. */
const PX_PER_M = 1004;
const CENTRE_PX = [640, 360] as const;
/** Height in metres of the picture centre in the model. */
const CENTRE_HEIGHT = 0.34;

/** Image pixel to model metres: x across, y up. */
export function neonPoint([px, py]: readonly [number, number]): [number, number] {
  return [(px - CENTRE_PX[0]) / PX_PER_M, CENTRE_HEIGHT - (py - CENTRE_PX[1]) / PX_PER_M];
}
