// A Viewer at rest (issue 214, review 18): with nothing playing, the Scopes, Spectrums and the Envelope Timeline drew
// the same silent picture sixty times a second. Each now draws a still picture once and skips the frames that would
// draw it again, until something it draws from changes.

const same = (a: unknown, b: unknown) =>
  a instanceof Float32Array && b instanceof Float32Array ? a.length === b.length && a.every((v, i) => Object.is(v, b[i])) : Object.is(a, b);

/**
 * Called once a frame before a Viewer draws, with whether its picture is still (its Tap silent long enough, nothing in
 * it moving) and everything else the picture is drawn from (its size, colours, settings, curves): true when the frame
 * can be skipped, the canvas already showing exactly this. A moving picture is drawn every frame; a still one once.
 */
export function createRest() {
  let drawn: readonly unknown[] | null = null;
  return (still: boolean, inputs: readonly unknown[]): boolean => {
    const rest = still && drawn !== null && drawn.length === inputs.length && drawn.every((v, i) => same(v, inputs[i]));
    drawn = still ? inputs : null;
    return rest;
  };
}

/**
 * How long a Viewer has been silent, called once a frame with whether it is silent now and the time (in any unit): 0
 * while it sounds and on its first silent frame. A picture still holding the last of a sound (the Glow's fading traces,
 * the Timeline's last Note) waits for this to pass its span before it rests.
 */
export function createSilence() {
  let since: number | null = null;
  return (silent: boolean, now: number): number => {
    if (!silent) since = null;
    else since ??= now;
    return since === null ? 0 : now - since;
  };
}
