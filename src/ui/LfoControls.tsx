import type { Dispatch, SetStateAction } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import type { LfoWaveform } from '../modulation/lfo';
import { LFO_KEYS, setLfo, type LfoNumber, type ParamId, type Patch } from '../patch/patch';
import { DestinationPicker } from './DestinationPicker';
import { Knob } from './Knob';
import { LfoPlot } from './LfoPlot';
import { SubBlock } from './SubBlock';
import { TIPS } from './tips';
import { Tooltip } from './Tooltip';
import { useLearnable } from './learn';

// One cycle of each LFO Waveform, in a 24×14 box.
const SHAPES: { waveform: LfoWaveform; label: string; path: string }[] = [
  { waveform: 'sine', label: 'Sine', path: 'M2 7 C5 0, 9 0, 12 7 S19 14, 22 7' },
  { waveform: 'triangle', label: 'Triangle', path: 'M2 7 L7 2 L17 12 L22 7' },
  { waveform: 'square', label: 'Square', path: 'M2 12 V2 H12 V12 H22 V2' },
  { waveform: 'saw', label: 'Saw', path: 'M2 12 L12 2 V12 L22 2' },
  { waveform: 'sawDown', label: 'Saw Down', path: 'M2 2 L12 12 V2 L22 12' },
];

interface Props {
  lfo: LfoNumber;
  engine: SynthEngine;
  patch: Patch;
  onParam(id: ParamId, value: number): void;
  onPatch: Dispatch<SetStateAction<Patch>>;
}

/** One LFO, in two rows: its shape and destination, then its Rate and Depth beside a plot of it moving. */
export function LfoControls({ lfo, engine, patch, onParam, onPatch }: Props) {
  const keys = LFO_KEYS[lfo];
  const off = patch[keys.amount] === 0;
  const learnShape = useLearnable({ kind: 'choice', id: keys.waveform });
  return (
    <SubBlock title={`LFO ${lfo}`} tip={TIPS.lfo} group>
      <div className="lfo-rows" data-lfo={lfo}>
        <div className="lfo-pickers">
          <div className="segmented icon-picker lfo-shapes" role="radiogroup" aria-label={`LFO ${lfo} Waveform`} {...learnShape}>
            {SHAPES.map((s) => (
              <button
                key={s.waveform}
                type="button"
                role="radio"
                aria-checked={s.waveform === patch[keys.waveform]}
                aria-label={s.label}
                onClick={() => onPatch((p) => setLfo(p, { waveform: s.waveform }, lfo))}
              >
                <svg viewBox="0 0 24 14" width="22" height="13" aria-hidden="true">
                  <path d={s.path} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
          <Tooltip content={TIPS.lfoDestination}>
            <DestinationPicker lfo={lfo} value={patch[keys.destination]} onChange={(destination) => onPatch((p) => setLfo(p, { destination }, lfo))} />
          </Tooltip>
        </div>
        <div className="lfo-play">
          <div className="knobs">
            <Knob id={keys.rate} value={patch[keys.rate]} onChange={(v) => onParam(keys.rate, v)} inactive={off} />
            <Knob id={keys.amount} value={patch[keys.amount]} onChange={(v) => onParam(keys.amount, v)} />
          </div>
          <Tooltip content={TIPS.lfoWaveform}>
            <LfoPlot engine={engine} lfo={lfo} />
          </Tooltip>
        </div>
      </div>
    </SubBlock>
  );
}
