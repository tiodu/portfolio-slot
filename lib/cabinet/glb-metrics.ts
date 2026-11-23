/**
 * Where the Blender cabinet (public/models/cabinet.glb) sits in the scene.
 * The model is in metres and about 0.5 m wide, the scene is about 2 units wide,
 * so it is scaled up. The numbers come from the exported file; re-measure them if
 * the cabinet changes shape.
 */
export const GLB_URL = "/models/cabinet.glb";

export const glb = {
  /** Scene units per metre of the model. */
  scale: 4.8,
  /** Lowest point of the model, in metres. The feet stand on `floorY`. */
  footY: -0.022,
  /** Scene height of the floor, the same as the shadow plane in world.tsx. */
  floorY: -1.19,
};

/** Scene position of a point on the model, given its height in metres. */
function sceneY(metres: number) {
  return glb.floorY + (metres - glb.footY) * glb.scale;
}

/** The reel window of the model in scene units. The zoom dollies towards this. */
export const glbWindow = {
  centre: [0, sceneY(0.273), 0.148 * glb.scale] as const,
  innerWidth: 0.38 * glb.scale,
};

/** The Blender cabinet is opt-in with `?glb` until it matches the procedural one. */
export function glbRequested() {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("glb");
}

/**
 * Each face of a GLB drum is 0.098 m wide along the axis and 2 * pi * 0.11 / 9 m long round it,
 * so the strip cells are taller than they are wide to keep the symbols undistorted.
 */
export const GLB_REEL = { radius: 0.11, width: 0.098 };
export const glbFaceAspect = (faces: number) => GLB_REEL.width / ((2 * Math.PI * GLB_REEL.radius) / faces);
