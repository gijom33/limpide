import type { Range } from './taper';

export type Unit = 'Hz' | 's' | '%';

export interface ParamDef extends Range {
  id: ParamId;
  label: string;
  unit: Unit;
  default: number;
}

export type ParamId = 'cutoff' | 'resonance' | 'ampAttack' | 'ampDecay' | 'ampSustain' | 'ampRelease';

export type Patch = Record<ParamId, number>;

const time = (id: ParamId, label: string, dflt: number): ParamDef => ({
  id, label, unit: 's', min: 0.001, max: 10, taper: 'log', default: dflt,
});

export const PARAMS: Record<ParamId, ParamDef> = {
  cutoff: { id: 'cutoff', label: 'Cutoff', unit: 'Hz', min: 20, max: 20000, taper: 'log', default: 2000 },
  resonance: { id: 'resonance', label: 'Resonance', unit: '%', min: 0, max: 1, taper: 'linear', default: 0.2 },
  ampAttack: time('ampAttack', 'Attack', 0.01),
  ampDecay: time('ampDecay', 'Decay', 0.3),
  ampSustain: { id: 'ampSustain', label: 'Sustain', unit: '%', min: 0, max: 1, taper: 'linear', default: 0.7 },
  ampRelease: time('ampRelease', 'Release', 0.4),
};

export function defaultPatch(): Patch {
  return Object.fromEntries(Object.values(PARAMS).map((d) => [d.id, d.default])) as Patch;
}

export function setParam(patch: Patch, id: ParamId, value: number): Patch {
  const { min, max } = PARAMS[id];
  return { ...patch, [id]: Math.min(max, Math.max(min, value)) };
}

/** A Parameter value in real units, e.g. "2.50 kHz", "12.3 ms", "70 %". */
export function formatParam(id: ParamId, value: number): string {
  switch (PARAMS[id].unit) {
    case 'Hz':
      return value >= 1000 ? `${(value / 1000).toFixed(2)} kHz` : `${Math.round(value)} Hz`;
    case 's':
      return value >= 1 ? `${value.toFixed(2)} s` : `${(value * 1000).toPrecision(3)} ms`;
    case '%':
      return `${Math.round(value * 100)} %`;
  }
}
