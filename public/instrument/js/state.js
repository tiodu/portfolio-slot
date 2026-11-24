/*
 * Concept: a finite state machine.
 * The site is always in exactly one named state, and only the events
 * listed for that state can move it. That one rule is what makes the
 * sequence safe to interrupt: a click that does not fit the current
 * state is simply ignored instead of half-starting something.
 *
 *   idle ─PULL→ pulled ─SPIN→ spinning ─SETTLE→ settling ─LAND→ landed
 *     ▲                                                          │
 *     └─ARRIVE_HOME── transitioning ◄───────NAVIGATE─────────────┘
 *                       │    ▲  └─PULL→ pulled (from "Pull again")
 *            ARRIVE_CASE│    │NAVIGATE
 *                       ▼    │
 *                     caseStudy
 *
 * NAVIGATE is allowed from every state: it is the interrupt.
 */

const EDGES = {
  idle:          { PULL: 'pulled', NAVIGATE: 'transitioning' },
  pulled:        { SPIN: 'spinning', NAVIGATE: 'transitioning' },
  spinning:      { SETTLE: 'settling', NAVIGATE: 'transitioning' },
  settling:      { LAND: 'landed', NAVIGATE: 'transitioning' },
  landed:        { NAVIGATE: 'transitioning' },
  transitioning: { PULL: 'pulled', ARRIVE_HOME: 'idle', ARRIVE_CASE: 'caseStudy', NAVIGATE: 'transitioning' },
  caseStudy:     { NAVIGATE: 'transitioning' },
};

export function createMachine(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    get state() { return state; },
    is: (...names) => names.includes(state),
    send(event) {
      const next = EDGES[state][event];
      if (!next) return false;
      const prev = state;
      state = next;
      listeners.forEach((fn) => fn(state, prev, event));
      return true;
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
