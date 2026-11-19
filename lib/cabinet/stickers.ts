import * as THREE from "three";

function textureFrom(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw a side sticker");
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function drawShapes(ctx: CanvasRenderingContext2D, size: number) {
  const blob = (x: number, y: number, radius: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };
  blob(size * 0.38, size * 0.34, size * 0.16, "#a259ff");
  blob(size * 0.58, size * 0.3, size * 0.15, "#1abcfe");
  blob(size * 0.68, size * 0.5, size * 0.16, "#0acf83");
  blob(size * 0.56, size * 0.68, size * 0.15, "#ff7262");
  blob(size * 0.36, size * 0.58, size * 0.17, "#f24e1e");
}

function drawAsterisk(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2;
  const cy = size / 2;
  ctx.strokeStyle = "#ff7a18";
  ctx.lineCap = "round";
  ctx.lineWidth = size * 0.07;
  for (let spoke = 0; spoke < 8; spoke += 1) {
    const angle = (spoke * Math.PI) / 8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * size * 0.12, cy + Math.sin(angle) * size * 0.12);
    ctx.lineTo(cx + Math.cos(angle) * size * 0.4, cy + Math.sin(angle) * size * 0.4);
    ctx.stroke();
  }
}

function drawShip(ctx: CanvasRenderingContext2D, size: number) {
  const family = getComputedStyle(document.body).fontFamily;
  ctx.fillStyle = "#1b1916";
  roundRect(ctx, size * 0.06, size * 0.28, size * 0.88, size * 0.44, size * 0.12);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.round(size * 0.16)}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ship it", size / 2, size * 0.51);
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

export function createStickerTextures() {
  return {
    shapes: textureFrom(drawShapes),
    asterisk: textureFrom(drawAsterisk),
    ship: textureFrom(drawShip),
  };
}
