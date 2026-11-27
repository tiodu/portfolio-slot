/*
 * Dev panel (localhost or ?dev): frame rate, what the GPU holds, and the
 * leak test. "Switch x50" cycles the themes 50 times, waiting for each
 * rebuild, then compares geometry and texture counts with the start.
 * If disposal works, they match.
 */
import { themes, applyTheme, currentTheme } from '../themes.js';

export function mountDevPanel(el, stage) {
  const phone = matchMedia('(max-width: 899px)').matches;
  el.innerHTML = `<details${phone ? '' : ' open'}><summary>Dev panel</summary>
    <dl>
      <dt>FPS</dt><dd data-k="fps">-</dd>
      <dt>Draw calls</dt><dd data-k="calls">-</dd>
      <dt>Triangles</dt><dd data-k="triangles">-</dd>
      <dt>Geometries</dt><dd data-k="geometries">-</dd>
      <dt>Textures</dt><dd data-k="textures">-</dd>
      <dt>Programs</dt><dd data-k="programs">-</dd>
      <dt>Envelope</dt><dd data-k="fits">-</dd>
    </dl>
    <button type="button">Switch x50</button>
    <output aria-live="polite"></output></details>`;
  el.hidden = false;
  const cell = (k) => el.querySelector(`[data-k="${k}"]`);
  const button = el.querySelector('button');
  const out = el.querySelector('output');

  // Frame rate from requestAnimationFrame, averaged over half a second.
  let frames = 0, since = performance.now();
  (function count(now) {
    frames++;
    if (now - since >= 500) {
      cell('fps').textContent = Math.round((frames * 1000) / (now - since));
      const s = stage.stats();
      for (const k of ['calls', 'triangles', 'geometries', 'textures', 'programs']) cell(k).textContent = s[k].toLocaleString('en-GB');
      cell('fits').textContent = stage.fits ? 'inside' : 'OUTSIDE';
      frames = 0; since = now;
    }
    requestAnimationFrame(count);
  })(performance.now());

  button.addEventListener('click', async () => {
    button.disabled = true;
    await stage.settled();
    const start = currentTheme();
    const before = stage.stats();
    const names = Object.keys(themes);
    let i = names.indexOf(start);
    const t0 = performance.now();
    for (let n = 1; n <= 50; n++) {
      i = (i + 1) % names.length;
      applyTheme(names[i], { transition: false });
      await stage.settled();
      out.textContent = `Switching ${n} of 50`;
    }
    applyTheme(start, { transition: false });      // back where we started, like for like
    await stage.settled();
    const after = stage.stats();
    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    const same = before.geometries === after.geometries && before.textures === after.textures;
    out.textContent = `Before: ${before.geometries} geometries, ${before.textures} textures\n`
      + `After 50 (+1 back): ${after.geometries} geometries, ${after.textures} textures\n`
      + `${same ? 'No leak' : 'LEAK'} in ${secs}s`;
    console.info('switch x50', { before, after, secs });
    button.disabled = false;
  });
}
