import type { SynthEngine } from '../engine/synthEngine';

/** A Note the engine was asked to start: its Note number, its start and when it was handed over, on the audio clock. */
export interface StartedNote {
  note: number;
  at: number;
  handed: number;
}

declare global {
  interface Window {
    /** In the end-to-end tests' build only: every Note the engine started, in the order it was asked (issue 198). */
    __limpideNotes?: StartedNote[];
  }
}

/**
 * In the end-to-end tests' build only, every Note the engine is asked to start is written down on the page, with its
 * start and the moment it was handed over, so a test can check the players keep time (issue 198). `import.meta.env.MODE`
 * is fixed at build time: the published site has none of this.
 */
export function notesInTests(engine: SynthEngine) {
  if (import.meta.env.MODE !== 'e2e') return;
  const started: StartedNote[] = [];
  window.__limpideNotes = started;
  const noteOn = engine.noteOn;
  engine.noteOn = (note, velocity, at, options) => {
    const now = engine.now();
    started.push({ note, at: at ?? now, handed: now });
    noteOn(note, velocity, at, options);
  };
}
