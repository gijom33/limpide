import type { Timers } from './transport';

// The worker's whole code: it waits on its own timers, which a browser does not slow when the page goes to the
// background, and says which one is due.
const WORKER = `
const waiting = new Map();
onmessage = ({ data: { id, ms } }) => {
  if (ms === undefined) {
    clearTimeout(waiting.get(id));
    waiting.delete(id);
    return;
  }
  waiting.set(id, setTimeout(() => {
    waiting.delete(id);
    postMessage(id);
  }, ms));
};
`;

const pageTimers: Timers = {
  after(ms, fn) {
    const timer = setTimeout(fn, ms);
    return () => clearTimeout(timer);
  },
};

let shared: Timers | undefined;

/**
 * Timers for the players' ticks (issue 198). A browser slows a background page's own timers to about once a second
 * (Safari also an unfocused window's), but not a worker's, nor the messages a worker sends: so they wait in a worker.
 * Where a worker cannot be made, the page's timers.
 */
export function backgroundTimers(): Timers {
  if (shared) return shared;
  shared = pageTimers;
  if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL.createObjectURL !== 'function') return shared;
  try {
    const worker = new Worker(URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' })));
    const due = new Map<number, () => void>();
    let last = 0;
    let failed = false;
    const rearmed = new Map<number, () => void>();
    worker.onmessage = ({ data: id }: MessageEvent<number>) => {
      const fn = due.get(id);
      due.delete(id);
      fn?.();
    };
    // A worker that cannot start says so only later: what waits on it goes back to the page's timers, as does all after.
    worker.onerror = () => {
      failed = true;
      for (const [id, fn] of due)
        rearmed.set(id, pageTimers.after(0, () => {
          rearmed.delete(id);
          fn();
        }));
      due.clear();
    };
    shared = {
      after(ms, fn) {
        if (failed) return pageTimers.after(ms, fn);
        const id = ++last;
        due.set(id, fn);
        worker.postMessage({ id, ms });
        return () => {
          if (due.delete(id)) worker.postMessage({ id });
          rearmed.get(id)?.();
          rearmed.delete(id);
        };
      },
    };
  } catch {
    // A worker refused at once (a page's security policy, say): the page's timers will do, slowed in the background.
  }
  return shared;
}
