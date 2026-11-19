import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

const base = process.env.SPIKE_URL ?? "http://127.0.0.1:3000";
const outDir = process.env.SPIKE_OUT ?? "/tmp/spike-measure";
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome",
  headless: "new",
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
    "--hide-scrollbars",
    "--no-sandbox",
  ],
});

const page = await browser.newPage();
const client = await page.createCDPSession();

async function sample(route, width, height, { throttle, scale, shot }) {
  await client.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  await page.setViewport({ width, height, deviceScaleFactor: scale });
  await page.goto(`${base}${route}`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector('[data-ready="true"]', { timeout: 20000 });
  const timing = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const mark = performance.getEntriesByName("cabinet-first-frame")[0];
        const root = document.querySelector(".spike-scene");
        const samples = [];
        let last = 0;
        let seen = 0;
        const step = (now) => {
          if (last !== 0) {
            seen += 1;
            if (seen > 5) samples.push(now - last);
          }
          last = now;
          if (samples.length < 12) requestAnimationFrame(step);
          else {
            const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
            resolve({
              firstFrameMs: mark ? Math.round(mark.startTime) : null,
              renderer: root?.dataset.renderer ?? "",
              phase: root?.dataset.phase ?? "",
              frameMs: Math.round(average),
              fps: Math.round((1000 / average) * 10) / 10,
              overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            });
          }
        };
        requestAnimationFrame(step);
      }),
  );
  if (shot && process.env.SPIKE_SHOTS === "1") {
    await page.screenshot({ path: `${outDir}/${shot}` });
  }
  return { route, width, height, throttle, scale, ...timing };
}

const results = [];
for (const route of ["/spike/procedural", "/spike/modelled"]) {
  const name = route.split("/").pop();
  results.push(
    await sample(route, 1440, 900, { throttle: 1, scale: 1, shot: `${name}-1440.png` }),
  );
  results.push(
    await sample(route, 390, 844, { throttle: 4, scale: 2, shot: `${name}-390.png` }),
  );
}

await client.send("Emulation.setCPUThrottlingRate", { rate: 1 });
console.log(JSON.stringify({ base, outDir, results }, null, 2));
await browser.close();
