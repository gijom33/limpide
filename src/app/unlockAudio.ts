export type AudioStatus = 'waiting' | 'running' | 'blocked';

/** The part of an AudioContext this needs, so tests can stand in for it. */
export interface UnlockableContext extends EventTarget {
  readonly state: AudioContextState;
  resume(): Promise<void>;
}

// Safari on an iPhone lets sound start only as a finger lifts (touchend, pointerup, click), not as it lands.
const GESTURES = ['keydown', 'pointerdown', 'pointerup', 'touchend', 'click'] as const;
// Back on the page: worth a try at once, though a browser may still want a gesture first.
const RETURNS = ['visibilitychange', 'pageshow', 'focus'] as const;
// The options form: Node's EventTarget (used in tests) ignores a boolean capture flag on removal.
const CAPTURE = { capture: true };

/**
 * Browsers keep audio suspended until the page is interacted with (autoplay policy), and may stop it again later:
 * Safari on an iPhone does when another app comes in front (its 'interrupted'), and leaves it stopped on return. This
 * resumes it on a key press, click, touch or drag whenever it is not running — synchronously inside that gesture,
 * which Safari requires — and, once it has run, tries at once on coming back to the page. It reports 'waiting' while it is not running,
 * and 'blocked' if a gesture did not start it, so the page can ask for a click. Returns a teardown function.
 */
export function unlockAudio(ctx: UnlockableContext, page: EventTarget, onChange: (status: AudioStatus) => void): () => void {
  const running = () => ctx.state === 'running';
  // Before the sound first runs, only a gesture can start it: a try without one is refused, with a warning in the console.
  let ran = running();
  const onState = () => {
    ran ||= running();
    onChange(running() ? 'running' : 'waiting');
  };
  function onGesture() {
    if (running()) return;
    ctx.resume().then(
      () => !running() && onChange('blocked'),
      () => onChange('blocked'),
    );
  }
  function onReturn() {
    if (ran && !running()) ctx.resume().catch(() => {});
  }

  onChange(running() ? 'running' : 'waiting');
  for (const g of GESTURES) page.addEventListener(g, onGesture, CAPTURE);
  for (const r of RETURNS) page.addEventListener(r, onReturn);
  ctx.addEventListener('statechange', onState);
  return () => {
    for (const g of GESTURES) page.removeEventListener(g, onGesture, CAPTURE);
    for (const r of RETURNS) page.removeEventListener(r, onReturn);
    ctx.removeEventListener('statechange', onState);
  };
}

/**
 * Safari on iPhone treats web audio like a ringtone by default: the silent switch mutes it without a word.
 * Declaring the page a 'playback' session makes it sound like a music app instead (iOS 17+, ignored elsewhere).
 * Called before the AudioContext is made.
 */
export function playThroughSilentMode(nav: object): void {
  // Not yet in TypeScript's DOM types.
  const { audioSession } = nav as { audioSession?: { type: string } };
  if (audioSession) audioSession.type = 'playback';
}
