import { createContext } from 'react';
import type { Patch } from '../patch/patch';

/** The Patch while the Synth Geek Layer is on (its readouts depend on it, e.g. Q on the Filter Mode), else null. */
export const GeekContext = createContext<Patch | null>(null);
