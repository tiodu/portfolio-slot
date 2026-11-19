import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import puppeteer from "puppeteer-core";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "public/cabinet-still.webp");
const limit = 150 * 1024;
const url = process.argv[2] ?? "http://localhost:3000/?capture=1";

const candidates = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const executablePath = candidates.find((path) => existsSync(path));

if (!executablePath) {
  console.error("Set CHROME_PATH to a Chrome or Chromium binary.");
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=swiftshader", "--hide-scrollbars"],
});

try {
  const page = await browser.newPage();
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      console.log(`page ${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    console.log(`page error: ${error.message}`);
  });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector('.cabinet[data-live="true"]', { timeout: 30000 });
  await page.evaluate(
    () =>
      new Promise((resolveFrame) => {
        requestAnimationFrame(() => requestAnimationFrame(resolveFrame));
      }),
  );

  const attempts = [
    { maxWidth: 900, quality: 0.82 },
    { maxWidth: 800, quality: 0.72 },
    { maxWidth: 720, quality: 0.64 },
    { maxWidth: 640, quality: 0.56 },
  ];
  let chosen = null;
  for (const attempt of attempts) {
    const dataUrl = await page.evaluate(({ maxWidth, quality }) => {
      const source = document.querySelector(".cabinet-scene canvas");
      if (!(source instanceof HTMLCanvasElement)) return "";
      const scale = Math.min(1, maxWidth / source.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(source.width * scale));
      canvas.height = Math.max(1, Math.round(source.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/webp", quality);
    }, attempt);
    if (!dataUrl.startsWith("data:image/webp")) continue;
    const buffer = Buffer.from(dataUrl.split(",")[1], "base64");
    console.log(`attempt ${attempt.maxWidth}@${attempt.quality} ${buffer.length}`);
    if (buffer.length <= limit) {
      chosen = buffer;
      break;
    }
  }

  if (!chosen) {
    console.error(`Still stayed over the ${limit} byte limit.`);
    process.exit(1);
  }

  writeFileSync(out, chosen);
  console.log(`${out} ${chosen.length}`);
} finally {
  await browser.close();
}
