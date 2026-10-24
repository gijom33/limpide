export type AudioStatus = 'waiting' | 'running' | 'blocked';

/** The part of an AudioContext this needs, so tests can stand in for it. */
export interface UnlockableContext extends EventTarget {
  readonly state: AudioContextState;
  resume(): Promise<void>;
}

const GESTURES = ['keydown', 'pointerdown'] as const;
// The options form: Node's EventTarget (used in tests) ignores a boolean capture flag on removal.
const CAPTURE = { capture: true };

/**
 * Browsers keep audio suspended until the page is interacted with (autoplay policy). This resumes it on the
 * first key press, click or drag — synchronously inside that gesture, which Safari requires — and reports
 * 'blocked' if the browser still refuses, so the page can ask for a click. Returns a teardown function.
 */
export function unlockAudio(ctx: UnlockableContext, page: EventTarget, onChange: (status: AudioStatus) => void): () => void {
  const stop = () => {
    for (const g of GESTURES) page.removeEventListener(g, onGesture, CAPTURE);
    ctx.removeEventListener('statechange', onState);
  };
  const onState = () => {
    if (ctx.state === 'running') {
      onChange('running');
      stop();
    }
  };
  function onGesture() {
    ctx.resume().then(
      () => ctx.state !== 'running' && onChange('blocked'),
      () => onChange('blocked'),
    );
  }

  if (ctx.state === 'running') {
    onChange('running');
    return () => {};
  }
  onChange('waiting');
  for (const g of GESTURES) page.addEventListener(g, onGesture, CAPTURE);
  ctx.addEventListener('statechange', onState);
  return stop;
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
