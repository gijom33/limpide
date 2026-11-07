import type { SynthEngine } from '../engine/synthEngine';

/** How long nothing must have sounded before the page pauses the sound, in seconds (issue 216). */
export const PAUSE_AFTER = 30;
/** How often the page looks, in milliseconds: a hidden tab's timers may come less often, which only pauses it later. */
const LOOK_EVERY = 1000;

/**
 * The engine's methods that change what it plays: each wakes it first, whatever calls it (a key, the piano, MIDI, a
 * player). A test calls every method of a real engine and checks these are the ones that schedule sound (issue 238).
 */
export const WAKES = ['noteOn', 'pitchChange', 'setBend', 'setPressure', 'noteOff', 'release', 'silence', 'applyPatch', 'setTempo'] as const;
// The page's own gestures wake it ahead of the Note they may bring: the time a browser takes to resume is then spent
// before the Note rather than after it.
const GESTURES = ['keydown', 'pointerdown', 'pointermove'] as const;

/** The part of an AudioContext this needs, so tests can stand in for it. */
export interface PausableContext extends EventTarget {
  readonly state: AudioContextState;
  suspend(): Promise<void>;
  resume(): Promise<void>;
}

type PausableEngine = Pick<SynthEngine, 'now' | 'quietFrom' | 'pause' | 'wake' | 'paused'> & Record<(typeof WAKES)[number], (...args: never[]) => void>;

/**
 * Pauses the sound in a long silence (issue 216, review 18): once no Voice has sounded for `after` seconds, with
 * nothing playing by itself and no Controller's clock followed (`busy`), the AudioContext is suspended, so the
 * browser's audio thread stops and the Viewers rest on their last picture. Anything that changes what the engine
 * plays wakes it first, and resumes the sound at once, so the Note sounds from its very start. Never where the browser
 * wants a tap to resume (`allowed` false: an iPhone's Safari), and never again where a resume is refused after all: the
 * page is then told, by a `statechange`, that the sound is stopped. Wraps the engine's methods. Returns `wake`, for
 * what wakes it ahead of a Note other than the page's gestures (a Controller's message, issue 238), and a teardown.
 */
export function pauseInSilence({
  ctx,
  engine,
  page,
  busy,
  allowed = true,
  after = PAUSE_AFTER,
  wall = () => performance.now() / 1000,
}: {
  ctx: PausableContext;
  engine: PausableEngine;
  page: EventTarget;
  busy: () => boolean;
  allowed?: boolean;
  after?: number;
  wall?: () => number;
}): { wake(): void; stop(): void } {
  let pausable = allowed;
  // When something last sounded, played or woke it, on the page's clock.
  let lastHeard = wall();
  const refused = () => {
    pausable = false;
    ctx.dispatchEvent(new Event('statechange'));
  };
  const wake = () => {
    if (!engine.paused()) return;
    engine.wake();
    lastHeard = wall();
    ctx.resume().then(() => ctx.state !== 'running' && refused(), refused);
  };
  for (const name of WAKES) {
    const change = engine[name];
    engine[name] = (...args: never[]) => {
      wake();
      change(...args);
    };
  }
  const lookForSilence = () => {
    if (engine.paused()) return;
    const quiet = pausable && ctx.state === 'running' && !busy() && engine.now() >= engine.quietFrom();
    if (!quiet) lastHeard = wall();
    else if (wall() - lastHeard >= after) {
      engine.pause();
      // A suspend refused leaves the sound running: the engine's clock is the one to draw from again, never paused.
      ctx.suspend().catch(() => {
        pausable = false;
        engine.wake();
      });
    }
  };
  // Started again by another hand (the browser, a tap): the engine's clock runs again, so it is woken.
  const onState = () => ctx.state === 'running' && wake();
  const timer = setInterval(lookForSilence, LOOK_EVERY);
  for (const g of GESTURES) page.addEventListener(g, wake);
  ctx.addEventListener('statechange', onState);
  return {
    wake,
    stop() {
      clearInterval(timer);
      for (const g of GESTURES) page.removeEventListener(g, wake);
      ctx.removeEventListener('statechange', onState);
    },
  };
}
