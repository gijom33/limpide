import type { Dispatch, SetStateAction } from 'react';
import type { SynthEngine } from '../engine/synthEngine';
import { setLfo, type LfoDestination, type ParamId, type Patch } from '../patch/patch';
import { Knob } from './Knob';
import { LfoPlot } from './LfoPlot';
import { Segmented } from './Segmented';
import { SubBlock } from './SubBlock';
import { TIPS } from './tips';
import { Tooltip } from './Tooltip';

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

/** The LFO: its plot (which also picks the shape), Destination, Rate and Depth. */
export function LfoControls({ engine, patch, onParam, onPatch }: Props) {
  const off = patch.lfoAmount === 0;
  return (
    <div className="timeline-controls">
      <SubBlock title="LFO" tip={TIPS.lfo} group>
        <div className="lfo-rows">
          <div className="lfo-pickers">
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
              <LfoPlot engine={engine} waveform={patch.lfoWaveform} onChange={(waveform) => onPatch((p) => setLfo(p, { waveform }))} />
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
