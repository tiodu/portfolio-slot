/*
 * Free the GPU memory behind some objects: every geometry, material and
 * texture under the given roots, plus any extra materials that are not on
 * a mesh right now (an unlit lamp's "on" material, say). Shared resources
 * are collected once, and disposing twice is harmless in Three.js.
 */
export function disposeAll(roots, extraMaterials = []) {
  const geometries = new Set(), materials = new Set(extraMaterials), textures = new Set();
  for (const root of roots) {
    root.traverse((o) => {
      if (o.geometry) geometries.add(o.geometry);
      for (const m of [].concat(o.material ?? [])) materials.add(m);
    });
  }
  for (const m of materials) for (const v of Object.values(m)) if (v?.isTexture) textures.add(v);
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}
