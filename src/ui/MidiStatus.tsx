import { TIPS } from './tips';
import { Tooltip } from './Tooltip';

export type MidiState = { kind: 'unsupported' } | { kind: 'denied' } | { kind: 'pending' } | { kind: 'ready'; devices: string[] };

/** A small MIDI indicator: a dot and the number of Controllers; the tooltip says what is connected. */
export function MidiStatus({ state }: { state: MidiState }) {
  const devices = state.kind === 'ready' ? state.devices : [];
  const body =
    state.kind === 'unsupported'
      ? 'This browser does not support Web MIDI (Safari does not). Use Chrome or Edge to play from a MIDI Controller; everything else works here.'
      : state.kind === 'denied'
        ? 'MIDI access was not allowed, so Controllers cannot be heard. Allow MIDI in the browser’s site settings, or open SynthView in Chrome or Edge (some built-in browsers never allow it).'
        : devices.length
          ? `Connected: ${devices.join(', ')}. Its keys and pads play the synth, with Velocity.`
          : 'No MIDI Controller connected. Plug one in (USB) and it is picked up straight away.';
  return (
    <Tooltip content={{ ...TIPS.midi, body }}>
      <span
        className="midi-status"
        role="status"
        aria-label="MIDI"
        data-connected={devices.length > 0 || undefined}
        data-unavailable={state.kind === 'unsupported' || state.kind === 'denied' || undefined}
        tabIndex={0}
      >
        <span className="midi-dot" aria-hidden="true" />
        MIDI{devices.length > 0 && <span className="midi-count">{devices.length}</span>}
      </span>
    </Tooltip>
  );
}
