import type { Dispatch, SetStateAction } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import type { LfoWaveform } from '../modulation/lfo';
import { setLfo, type LfoDestination, type ParamId, type Patch } from '../patch/patch';
import { Knob } from './Knob';
import { LfoPlot } from './LfoPlot';
import { Segmented } from './Segmented';
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

const DESTINATIONS: { value: LfoDestination; label: string }[] = [
  { value: 'cutoff', label: 'Cutoff' },
  { value: 'pitch', label: 'Pitch' },
  { value: 'pulseWidth', label: 'Pulse Width' },
];

interface Props {
  engine: SynthEngine;
  patch: Patch;
  onParam(id: ParamId, value: number): void;
  onPatch: Dispatch<SetStateAction<Patch>>;
}

/** The LFO: its shape and Destination, a plot of it moving beside them, then Rate and Depth. */
export function LfoControls({ engine, patch, onParam, onPatch }: Props) {
  const off = patch.lfoAmount === 0;
  const learnShape = useLearnable({ kind: 'choice', id: 'lfoWaveform' });
  return (
    <div className="timeline-controls">
      <SubBlock title="LFO" tip={TIPS.lfo} group>
        <div className="lfo-rows">
          <div className="lfo-pickers">
            <div className="segmented icon-picker lfo-shapes" role="radiogroup" aria-label="LFO Waveform" {...learnShape}>
              {SHAPES.map((s) => (
                <button
                  key={s.waveform}
                  type="button"
                  role="radio"
                  aria-checked={s.waveform === patch.lfoWaveform}
                  aria-label={s.label}
                  onClick={() => onPatch((p) => setLfo(p, { waveform: s.waveform }))}
                >
                  <svg viewBox="0 0 24 14" width="22" height="13" aria-hidden="true">
                    <path d={s.path} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
            <Tooltip content={TIPS.lfoDestination}>
              <Segmented
                label="LFO Destination"
                value={patch.lfoDestination}
                options={DESTINATIONS}
                onChange={(destination) => onPatch((p) => setLfo(p, { destination }))}
                learn={{ kind: 'choice', id: 'lfoDestination' }}
              />
            </Tooltip>
            <Tooltip content={TIPS.lfoWaveform}>
              <LfoPlot engine={engine} />
            </Tooltip>
          </div>
          <div className="knobs">
            <Knob id="lfoRate" value={patch.lfoRate} onChange={(v) => onParam('lfoRate', v)} inactive={off} />
            <Knob id="lfoAmount" value={patch.lfoAmount} onChange={(v) => onParam('lfoAmount', v)} />
          </div>
        </div>
      </SubBlock>
    </div>
  );
}
