/*
 * Concept: hash routing.
 * The URL is the source of truth for "which page", so every case study
 * has a link you can share and load directly. Routes live after "#/";
 * plain anchors like "#work" stay ordinary in-page links.
 * push(..) is "silent": the app already animated the change itself, so
 * the hashchange it causes is swallowed. Only changes the app did not
 * make (back button, typed URL, a link) reach onRoute.
 */

const CASE = '#/work/';

export function parse(hash = location.hash) {
  if (hash.startsWith(CASE)) return { name: 'case', slug: decodeURIComponent(hash.slice(CASE.length)) };
  const anchor = hash.startsWith('#') && !hash.startsWith('#/') && hash.length > 1 ? hash.slice(1) : null;
  return { name: 'home', anchor };
}

export const caseHref = (slug) => CASE + slug;
export const homeHref = '#/';

export function createRouter(onRoute) {
  let expected = null;
  addEventListener('hashchange', () => {
    if (expected !== null && location.hash === expected) { expected = null; return; }
    expected = null;
    onRoute(parse());
  });
  return {
    current: () => parse(),
    push(hash) {
      if (location.hash === hash) return;
      expected = hash;
      location.hash = hash;
    },
  };
}
