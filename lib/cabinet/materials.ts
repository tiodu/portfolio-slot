import * as THREE from "three";
import { colors } from "./metrics";

export const surface = {
  cream: {
    color: colors.cream,
    metalness: 0.04,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.05,
  },
  turquoise: {
    color: colors.turquoise,
    metalness: 0.06,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.12,
  },
  turquoiseDeep: {
    color: colors.turquoiseDeep,
    metalness: 0.08,
    roughness: 0.26,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.95,
  },
  jewel: {
    color: colors.jewel,
    metalness: 0.2,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.35,
    emissive: "#0e6f6a",
    emissiveIntensity: 0.4,
  },
  chrome: {
    color: colors.chrome,
    metalness: 1,
    roughness: 0.08,
    envMapIntensity: 1.55,
  },
  knob: {
    color: colors.knob,
    metalness: 0.16,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1,
  },
  dark: {
    color: colors.window,
    metalness: 0.08,
    roughness: 0.72,
  },
  glass: {
    color: "#ffffff",
    metalness: 0,
    roughness: 0.04,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    envMapIntensity: 1.4,
  },
  reelCap: {
    color: colors.reel,
    metalness: 0.02,
    roughness: 0.48,
  },
};

export function createNeonMaterial(color: string) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 2.8,
    roughness: 0.35,
    metalness: 0,
    toneMapped: false,
  });
}

export function createBulbMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: "#000000",
    emissive: "#ffffff",
    emissiveIntensity: 1.55,
    roughness: 0.38,
    metalness: 0,
    toneMapped: false,
  });

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vInstanceEmissive;",
      )
      .replace(
        "#include <color_vertex>",
        `#include <color_vertex>
        #ifdef USE_INSTANCING_COLOR
          vInstanceEmissive = instanceColor.rgb;
        #else
          vInstanceEmissive = vec3(1.0);
        #endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vInstanceEmissive;",
      )
      .replace(
        "vec3 totalEmissiveRadiance = emissive;",
        "vec3 totalEmissiveRadiance = emissive * vInstanceEmissive;",
      );
  };

  return material;
}
