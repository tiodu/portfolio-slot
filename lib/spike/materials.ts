import * as THREE from "three";
import { colors } from "./metrics";

export const surface = {
  red: {
    color: colors.red,
    metalness: 0.2,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
    envMapIntensity: 0.9,
  },
  redDeep: {
    color: colors.redDeep,
    metalness: 0.16,
    roughness: 0.38,
    clearcoat: 0.7,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.6,
  },
  chrome: {
    color: colors.chrome,
    metalness: 1,
    roughness: 0.16,
    envMapIntensity: 1.25,
  },
  drawer: {
    color: colors.drawer,
    metalness: 0.92,
    roughness: 0.28,
    envMapIntensity: 1,
  },
  knob: {
    color: colors.knob,
    metalness: 0.18,
    roughness: 0.32,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2,
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
  socket: {
    color: "#24180f",
    metalness: 0.72,
    roughness: 0.38,
  },
};

export function createBulbMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: "#000000",
    emissive: "#ffffff",
    emissiveIntensity: 1.45,
    roughness: 0.4,
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

export function createOverrideMaterials(symbolMap: THREE.Texture) {
  const red = new THREE.MeshPhysicalMaterial(surface.red);
  const chrome = new THREE.MeshStandardMaterial(surface.chrome);
  const drawer = new THREE.MeshStandardMaterial(surface.drawer);
  const knob = new THREE.MeshPhysicalMaterial(surface.knob);
  const dark = new THREE.MeshStandardMaterial(surface.dark);
  const glass = new THREE.MeshPhysicalMaterial(surface.glass);
  const socket = new THREE.MeshStandardMaterial(surface.socket);
  const reelSide = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map: symbolMap,
    roughness: 0.58,
    metalness: 0.02,
  });
  const reelCap = new THREE.MeshStandardMaterial(surface.reelCap);

  const owned = [red, chrome, drawer, knob, dark, glass, socket, reelSide, reelCap];

  return {
    red,
    chrome,
    drawer,
    knob,
    dark,
    glass,
    socket,
    reelSide,
    reelCap,
    bulb() {
      return new THREE.MeshStandardMaterial({
        color: "#000000",
        emissive: colors.bulbDim,
        emissiveIntensity: 1.35,
        roughness: 0.42,
        metalness: 0,
        toneMapped: false,
      });
    },
    dispose() {
      owned.forEach((material) => material.dispose());
    },
  };
}
