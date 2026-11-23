import * as THREE from "three";
import { FACE_COUNT, reelSymbols, type ReelSymbol } from "./symbol-list";

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

function drawLetter(ctx: CanvasRenderingContext2D, symbol: ReelSymbol) {
  const family = getComputedStyle(document.body).fontFamily;
  ctx.font = `700 120px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 14;
  ctx.strokeStyle = "#f2c14e";
  ctx.strokeText(symbol.label.slice(0, 1), 0, 6);
  ctx.fillStyle = "#17171f";
  ctx.fillText(symbol.label.slice(0, 1), 0, 6);
}

function drawSymbol(ctx: CanvasRenderingContext2D, symbol: ReelSymbol) {
  if (symbol.mark === "cherry") drawCherry(ctx);
  else if (symbol.mark === "seven") drawSeven(ctx);
  else if (symbol.mark === "star") drawStar(ctx);
  else if (symbol.mark === "bar") drawBar(ctx);
  else drawLetter(ctx, symbol);
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

/**
 * The strip of symbols, one cell per face, side by side round the drum.
 * `aspect` is each face's length along the reel axis divided by its length round the drum.
 * A square face is 1; a narrower drum needs less than 1, a wider one more.
 */
export function createSymbolTexture(anisotropy: number, aspect = 1) {
  const height = Math.round(CELL * aspect);
  const canvas = document.createElement("canvas");
  canvas.width = CELL * FACE_COUNT;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw reel symbols");

  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < FACE_COUNT; index += 1) {
    ctx.save();
    ctx.translate(index * CELL + CELL / 2, height / 2);
    // Rotate the cell onto the cylinder, then flip Y so BAR stays upright.
    // A negative X scale keeps the letters reading left to right.
    ctx.rotate(-Math.PI / 2);
    ctx.scale(-CELL / 256, -CELL / 256);
    drawSymbol(ctx, reelSymbols[index]);
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
