/* The plain work index: the accessible, no-game way in. */
import { studies } from '../content.js';
import { caseHref } from '../router.js';

export function renderIndex(list) {
  list.innerHTML = studies.map((s) => `
    <li>
      <a class="row" href="${caseHref(s.slug)}">
        <span class="row-n mono">${s.n}</span>
        <span class="row-title">${s.title}</span>
        <span class="row-meta mono">${s.platform}</span>
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
    </li>`).join('');
}
