/*
 * The theme switcher, built from the theme data: add a theme to
 * js/themes.js and it appears here. Native radio buttons do the keyboard
 * and screen reader work (Tab in, arrows to choose, "2 of 3, checked").
 */
import { themes, applyTheme, currentTheme } from '../themes.js';

export function mountThemeSwitch(el) {
  const now = currentTheme();
  el.innerHTML = `<span id="theme-switch-label" class="theme-switch-label mono">Theme</span>`
    + Object.values(themes).map((t) => `
    <label class="theme-opt">
      <input type="radio" name="theme" value="${t.name}"${t.name === now ? ' checked' : ''}>
      <span class="mono">${t.label}</span>
    </label>`).join('');
  el.hidden = false;
  el.addEventListener('change', (e) => applyTheme(e.target.value));
  // Keep the radios true if the theme changes from elsewhere.
  document.addEventListener('themechange', (e) => {
    const input = el.querySelector(`input[value="${e.detail.name}"]`);
    if (input) input.checked = true;
  });
}
