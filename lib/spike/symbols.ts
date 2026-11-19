import * as THREE from "three";
import { FACES } from "./rig";

const CELL = 384;

function drawCherry(ctx: CanvasRenderingContext2D) {
  ctx.lineCap = "round";
  ctx.strokeStyle = "#1c8f45";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(8, -78);
  ctx.quadraticCurveTo(-6, -10, -36, 8);
  ctx.moveTo(8, -78);
  ctx.quadraticCurveTo(24, -8, 34, 18);
  ctx.stroke();

  ctx.fillStyle = "#2eaf58";
  ctx.beginPath();
  ctx.ellipse(40, -70, 30, 14, -0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e1062c";
  ctx.beginPath();
  ctx.arc(-28, 30, 38, 0, Math.PI * 2);
  ctx.arc(32, 24, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.beginPath();
  ctx.arc(-42, 16, 11, 0, Math.PI * 2);
  ctx.arc(18, 10, 9, 0, Math.PI * 2);
  ctx.fill();
}

function drawSeven(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#ff2d40";
  ctx.beginPath();
  ctx.moveTo(-62, -70);
  ctx.lineTo(66, -70);
  ctx.lineTo(66, -40);
  ctx.lineTo(-4, 78);
  ctx.lineTo(-40, 78);
  ctx.lineTo(28, -40);
  ctx.lineTo(-62, -40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(-48, -66, 90, 10);
}

function drawBar(ctx: CanvasRenderingContext2D) {
  roundRect(ctx, -86, -46, 172, 92, 18);
  ctx.fillStyle = "#17171f";
  ctx.fill();
  const family = getComputedStyle(document.body).fontFamily;
  ctx.font = `700 58px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#17171f";
  ctx.strokeText("BAR", 0, 4);
  ctx.fillStyle = "#f2c14e";
  ctx.fillText("BAR", 0, 4);
}

function drawStar(ctx: CanvasRenderingContext2D) {
  starPath(ctx, 0, 4, 74, 32);
  ctx.fillStyle = "#f5c518";
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#c4840a";
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.ellipse(-16, -18, 12, 8, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function starPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outer: number,
  inner: number,
) {
  ctx.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const radius = point % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (point * Math.PI) / 5;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (point === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

const drawers = [drawCherry, drawSeven, drawBar, drawStar];

export function createSymbolTexture(anisotropy: number) {
  const canvas = document.createElement("canvas");
  canvas.width = CELL * FACES;
  canvas.height = CELL;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw reel symbols");

  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < FACES; index += 1) {
    ctx.save();
    ctx.translate(index * CELL + CELL / 2, CELL / 2);
    // Cylinder U runs around the reel, which is vertical on screen.
    ctx.rotate(-Math.PI / 2);
    ctx.scale(CELL / 256, CELL / 256);
    drawers[index % drawers.length](ctx);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function createNeonTexture(family: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the topper name");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `180px ${family}, cursive`;
  ctx.shadowColor = "#ff8a2a";
  ctx.shadowBlur = 28;
  ctx.fillStyle = "#fff4e4";
  ctx.fillText("Eduardo", 512, 168);
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#fffaf3";
  ctx.fillText("Eduardo", 512, 168);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createVegasTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 960;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the backdrop");

  ctx.fillStyle = "#07060e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const blobs: Array<[number, number, number, string]> = [
    [180, 160, 240, "rgba(92, 24, 120, 0.85)"],
    [480, 280, 220, "rgba(160, 24, 78, 0.7)"],
    [120, 520, 200, "rgba(14, 96, 110, 0.75)"],
    [420, 700, 260, "rgba(92, 58, 12, 0.65)"],
    [300, 120, 160, "rgba(24, 48, 120, 0.55)"],
  ];

  for (const [x, y, radius, color] of blobs) {
    const gradient = ctx.createRadialGradient(x, y, 10, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.filter = "blur(8px)";
  const streaks: Array<[number, number, string]> = [
    [80, 240, "#ff4d8d"],
    [360, 420, "#3de0d0"],
    [160, 640, "#ffb03a"],
    [400, 180, "#7aa2ff"],
  ];
  streaks.forEach(([x, y, color], index) => {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(x, y, 180 + (index % 2) * 40, 10);
  });
  ctx.filter = "none";
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createShadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the contact shadow");
  const gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
  gradient.addColorStop(0, "rgba(0,0,0,0.55)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
