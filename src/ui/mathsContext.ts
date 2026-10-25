import { createContext } from 'react';
import type { Patch } from '../patch/patch';

/** The Patch while the Maths Layer is on (its readouts depend on it, e.g. Q on the Filter Mode), else null. */
export const MathsContext = createContext<Patch | null>(null);
