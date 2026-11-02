import { createContext } from 'react';
import type { GeekNote } from '../music/geek';
import type { Patch } from '../patch/patch';

/** The Patch while the Synth Geek Layer is on (its readouts depend on it, e.g. Q on the Filter Mode), else null. */
export const GeekContext = createContext<Patch | null>(null);

/** Whether the Synth Geek Layer is on, for what needs no Patch: the tips' History lines (issue 134). */
export const GeekOnContext = createContext(false);

/** Where the Synth Geek Layer's readouts learn the Note their numbers use (issue 133, decision 6): the engine's newest. */
export interface GeekNoteSource {
  subscribe(listener: () => void): () => void;
  get(): GeekNote;
}
/** No Note ever played: the numbers stay at A4. */
const NO_NOTE: GeekNoteSource = { subscribe: () => () => {}, get: () => null };
export const GeekNoteContext = createContext<GeekNoteSource>(NO_NOTE);
