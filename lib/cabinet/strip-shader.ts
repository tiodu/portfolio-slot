export const STRIP_IMAGE = "/strip-bg.webp";
export const STRIP_IMAGE_SIZE = { width: 1280, height: 720 } as const;

export type StripControls = {
  hazeAmount: number;
  hazeSpeed: number;
  smearAmount: number;
  tint: string;
};

export const stripDefaults: StripControls = {
  hazeAmount: 0.014,
  hazeSpeed: 0.22,
  smearAmount: 0.01,
  tint: "#ffffff",
};

export const stripVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const stripFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uMap;
uniform float uTime;
uniform float uHazeAmount;
uniform float uHazeSpeed;
uniform float uSmearAmount;
uniform vec3 uTint;
uniform vec2 uResolution;
uniform vec2 uImageSize;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec2 coverUv(vec2 uv) {
  float screenAspect = uResolution.x / max(uResolution.y, 1.0);
  float imageAspect = uImageSize.x / max(uImageSize.y, 1.0);
  vec2 ratio = vec2(
    min(screenAspect / imageAspect, 1.0),
    min(imageAspect / screenAspect, 1.0)
  );
  return uv * ratio + (1.0 - ratio) * 0.5;
}

void main() {
  vec2 base = coverUv(vUv);

  // Heat strongest on the road (lower half of the plate).
  float heatMask = 1.0 - smoothstep(0.0, 0.58, vUv.y);
  vec2 noiseCoord = base * vec2(4.2, 2.6) + vec2(0.0, uTime * uHazeSpeed);
  float n1 = valueNoise(noiseCoord);
  float n2 = valueNoise(noiseCoord + vec2(19.2, 7.3));
  vec2 haze = vec2(n1 - 0.5, n2 - 0.5) * uHazeAmount * heatMask;
  vec2 distorted = clamp(base + haze, 0.0, 1.0);

  // Chromatic smear grows toward the screen edges.
  vec2 fromCenter = vUv - 0.5;
  float edge = length(fromCenter) * 2.0;
  float smear = uSmearAmount * edge * edge;
  vec2 dir = length(fromCenter) > 1e-4 ? normalize(fromCenter) : vec2(0.0);

  float r = texture2D(uMap, clamp(distorted + dir * smear, 0.0, 1.0)).r;
  float g = texture2D(uMap, distorted).g;
  float b = texture2D(uMap, clamp(distorted - dir * smear, 0.0, 1.0)).b;

  gl_FragColor = vec4(vec3(r, g, b) * uTint, 1.0);
}
`;
