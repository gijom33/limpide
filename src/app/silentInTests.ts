/**
 * In the end-to-end tests' build only, the page plays to a silent output: every AudioContext's `destination` is a gain
 * at 0 in front of the speakers, so the tests run without sound on the machine running them (the owner, 2026-10-30).
 * Everything before it plays and is measured as ever (the Taps, the safety limiter); an OfflineAudioContext, whose
 * output is what an engine test reads, is left alone. `import.meta.env.MODE` is fixed at build time: the published
 * site has none of this.
 */
export function silentInTests() {
  if (import.meta.env.MODE !== 'e2e') return;
  const speakers = Object.getOwnPropertyDescriptor(BaseAudioContext.prototype, 'destination')!.get!;
  const silent = new WeakMap<AudioContext, GainNode>();
  Object.defineProperty(AudioContext.prototype, 'destination', {
    configurable: true,
    get(this: AudioContext) {
      let gain = silent.get(this);
      if (!gain) {
        gain = this.createGain();
        gain.gain.value = 0;
        gain.connect(speakers.call(this));
        silent.set(this, gain);
      }
      return gain;
    },
  });
}
