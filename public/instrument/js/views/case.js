/*
 * Concept: one template, four fillings.
 * A case study is a function of its data. Everything that is not a
 * stated fact renders as a visible [TODO] so gaps are impossible to miss.
 * Elements marked data-reveal enter in a stagger; the element marked
 * data-flip is the numeral that arrives from the reel.
 */
import { studies, awards, TODO } from '../content.js';
import { dur, cssEase } from '../tokens.js';
import { animate } from '../motion.js';

const todo = (text = '') => `<span class="todo">${TODO}${text ? ` ${text}` : ''}</span>`;
const val = (v) => (v === TODO ? todo() : v);

function placeholder(label, kind = '') {
  return `<figure class="ph ${kind}" data-reveal>
    <div class="ph-box" role="img" aria-label="Image placeholder: ${label}"><span class="mono">Image placeholder</span></div>
    <figcaption class="mono">${label} ${todo()}</figcaption>
  </figure>`;
}

export function renderCase(index) {
  const s = studies[index];
  const next = studies[(index + 1) % studies.length];
  const awardsBlock = s.awards ? `
    <section class="cs-section cs-awards" aria-labelledby="cs-awards" data-reveal>
      <h2 id="cs-awards" class="cs-h mono">Recognition</h2>
      <ul class="awards">
        ${awards.map((a) => `<li><span class="award-title">${a.title}</span><span class="mono">${a.by}, ${a.year}</span></li>`).join('')}
      </ul>
      <p class="cs-note">Won with Pick'em.</p>
    </section>` : '';

  return `
  <article class="cs" aria-labelledby="cs-title">
    <header class="cs-hero">
      <p class="cs-kicker mono" data-reveal>Case study ${s.n} of 0${studies.length}</p>
      <span class="cs-numeral" data-flip aria-hidden="true">${s.n}</span>
      <h1 id="cs-title" class="cs-title" tabindex="-1" data-reveal>${s.title}</h1>
      <p class="cs-summary" data-reveal>${val(s.summary ?? TODO)}</p>
    </header>

    <dl class="facts" data-reveal>
      <div><dt class="mono">Role</dt><dd>${val(s.role ?? TODO)}</dd></div>
      <div><dt class="mono">Year</dt><dd>${val(s.year ?? TODO)}</dd></div>
      <div><dt class="mono">Team</dt><dd>${val(s.team ?? TODO)}</dd></div>
      <div><dt class="mono">Platform</dt><dd>${val(s.platform)}</dd></div>
      <div><dt class="mono">Scope</dt><dd>${val(s.scope)}</dd></div>
    </dl>

    ${placeholder(s.images[0], 'full')}

    <section class="cs-section" aria-labelledby="cs-problem" data-reveal>
      <h2 id="cs-problem" class="cs-h mono">The problem</h2>
      <p class="cs-lead">${todo('What was broken, for whom, and how you knew.')}</p>
    </section>

    <section class="cs-section" aria-labelledby="cs-did" data-reveal>
      <h2 id="cs-did" class="cs-h mono">What I did</h2>
      ${s.known ? `<p class="cs-lead">${s.known}</p>` : ''}
      <p>${todo('Your role, the team around you, and the work in order.')}</p>
    </section>

    <div class="two-up">
      ${placeholder(s.images[1])}
      ${placeholder(`${s.images[1]}, second view`)}
    </div>

    <section class="cs-section" aria-labelledby="cs-decisions" data-reveal>
      <h2 id="cs-decisions" class="cs-h mono">Key decisions</h2>
      <ol class="decisions">
        <li><span class="mono">A</span><p>${todo('Decision, the option you rejected, and why.')}</p></li>
        <li><span class="mono">B</span><p>${todo('Decision, the option you rejected, and why.')}</p></li>
        <li><span class="mono">C</span><p>${todo('Decision, the option you rejected, and why.')}</p></li>
      </ol>
    </section>

    <div class="annotated" data-reveal>
      ${placeholder(s.images[2], 'tall')}
      <ol class="notes">
        <li><span class="mono">1</span>${todo('Annotation')}</li>
        <li><span class="mono">2</span>${todo('Annotation')}</li>
        <li><span class="mono">3</span>${todo('Annotation')}</li>
      </ol>
    </div>

    <blockquote class="pull" data-reveal>
      <p>${todo('Pull quote, from a stakeholder or your own notes.')}</p>
      <footer class="mono">${todo('Name, role')}</footer>
    </blockquote>

    <section class="cs-section" aria-labelledby="cs-outcome" data-reveal>
      <h2 id="cs-outcome" class="cs-h mono">Outcome</h2>
      <p class="cs-lead">${todo('What shipped and what changed. Real numbers only.')}</p>
    </section>

    ${awardsBlock}

    <footer class="cs-foot">
      <button type="button" class="pull-again" data-action="pull-again">
        <span class="pa-label">Pull again</span>
        <span class="pa-next mono">Lands ${next.n}, ${next.title}</span>
      </button>
      <a class="mono cs-all" href="#work" data-action="all-work">Or see all work</a>
    </footer>
  </article>`;
}

/* Entrance. fromRect is where the reel numeral was on screen. */
export async function enterCase(root, { fromRect, mode, signal }) {
  const numeral = root.querySelector('[data-flip]');
  const items = [...root.querySelectorAll('.cs-hero [data-reveal], .cs > [data-reveal]')].slice(0, 6);
  if (mode === 'calm') return true;
  const jobs = [];
  let base = 0;
  if (mode === 'machine' && fromRect && numeral) {
    const to = numeral.getBoundingClientRect();
    const s = fromRect.height / to.height;
    const dx = fromRect.left + fromRect.width / 2 - (to.left + to.width / 2);
    const dy = fromRect.top + fromRect.height / 2 - (to.top + to.height / 2);
    jobs.push(animate(numeral, [
      { transform: `translate(${dx}px, ${dy}px) scale(${s})` },
      { transform: 'none' },
    ], { duration: dur.flip, easing: cssEase('flip') }, signal));
    base = dur.flip * 0.45;
  } else if (numeral) {
    jobs.push(animate(numeral, [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
      { duration: dur.shortEntrance, easing: cssEase('settle'), fill: 'backwards' }, signal));
    base = 60;
  }
  items.forEach((el, i) => jobs.push(animate(el,
    [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
    { duration: dur.reveal, delay: base + i * dur.stagger, easing: cssEase('settle'), fill: 'backwards' }, signal)));
  await Promise.all(jobs);
  return !signal?.aborted;
}

/* Exit. If the hero is on screen the numeral flies back into the reel. */
export async function leaveCase(root, { toRect, signal }) {
  const numeral = root.querySelector('[data-flip]');
  const r = numeral?.getBoundingClientRect();
  const heroVisible = r && r.bottom > 0 && r.top < innerHeight;
  const rest = [...root.querySelectorAll('.cs > *')].filter((el) => !el.contains(numeral));
  const heroBits = [...root.querySelectorAll('.cs-hero > *')].filter((el) => el !== numeral);
  const fadeOut = [{ opacity: 1 }, { opacity: 0 }];
  const opts = { duration: dur.pageOut, easing: cssEase('exit'), fill: 'forwards' };
  if (toRect && heroVisible) {
    const s = toRect.height / r.height;
    const dx = toRect.left + toRect.width / 2 - (r.left + r.width / 2);
    const dy = toRect.top + toRect.height / 2 - (r.top + r.height / 2);
    await Promise.all([
      ...[...rest, ...heroBits].map((el) => animate(el, fadeOut, opts, signal)),
      animate(numeral, [{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${s})` }],
        { duration: dur.flip * 0.75, easing: cssEase('push'), fill: 'forwards' }, signal),
    ]);
  } else {
    await animate(root, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.985)' }], opts, signal);
  }
  return !signal?.aborted;
}
