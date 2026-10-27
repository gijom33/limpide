import { useEffect, useRef, useState } from 'react';
import { isC16 } from '../midi/c16';
import { describeControl, describeMode, describeTarget } from '../midi/describe';
import { controlKey, type Control, type Mapping } from '../midi/mappings';
import { CloseIcon, MidiIcon } from './icons';
import { TIPS } from './tips';
import { Tooltip } from './Tooltip';

export type MidiState =
  { kind: 'unsupported'; ios: boolean } | { kind: 'denied' } | { kind: 'pending' } | { kind: 'ready'; devices: string[] };

interface Props {
  state: MidiState;
  /** The panel opens: the moment to ask the browser for MIDI. */
  onOpen(): void;
  /** The Activity Monitor: the last message received, described. */
  activity: string | null;
  mappings: readonly Mapping[];
  /** MIDI Learn (or Quick Setup) is on: the button says so, and the panel offers Done where Learn was started. */
  learning: boolean;
  onLearn(): void;
  onDone(): void;
  onQuickSetup(): void;
  /** Puts back the C16 layout (offered while a C16 is connected). */
  onC16Layout(): void;
  onRemove(control: Control): void;
  onClear(): void;
}

const statusText = (state: MidiState) => {
  const devices = state.kind === 'ready' ? state.devices : [];
  return state.kind === 'unsupported' && state.ios
    ? 'No browser on iPhone or iPad supports Web MIDI, Chrome included: Apple makes them all run on Safari’s engine. Play from a MIDI Controller on a computer or an Android device; everything else works here.'
    : state.kind === 'unsupported'
      ? 'This browser does not support Web MIDI (Safari does not). Use Chrome or Edge to play from a MIDI Controller; everything else works here.'
      : state.kind === 'denied'
        ? 'MIDI access was not allowed, so Controllers cannot be heard. Allow MIDI in the browser’s site settings, or open Limpide in Chrome or Edge (some built-in browsers never allow it).'
        : devices.length
          ? `Connected: ${devices.join(', ')}. Its keys and pads play the synth, with Velocity.`
          : 'No MIDI Controller connected. Plug one in (USB) and it is picked up straight away.';
};

/**
 * The MIDI button: a dot and the number of Controllers, or "Learning" while MIDI Learn is on. It opens the MIDI
 * panel: what is connected, the Activity Monitor, MIDI Learn (and Done, once learning), and the Mappings.
 */
export function MidiPanel({
  state, onOpen, activity, mappings, learning, onLearn, onDone, onQuickSetup, onC16Layout, onRemove, onClear,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const devices = state.kind === 'ready' ? state.devices : [];
  const available = state.kind === 'ready' || state.kind === 'pending';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onPointer = (e: PointerEvent) => !wrapper.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div className="midi-menu" ref={wrapper}>
      <Tooltip content={{ ...TIPS.midi, body: statusText(state) }}>
        <button
          type="button"
          className="tool midi-status"
          aria-label="MIDI"
          aria-expanded={open}
          data-connected={devices.length > 0 || undefined}
          data-waiting={(state.kind === 'ready' && !devices.length) || undefined}
          data-unavailable={!available || undefined}
          data-unsupported={state.kind === 'unsupported' || undefined}
          data-learning={learning || undefined}
          onClick={() => {
            if (!open) onOpen();
            setOpen(!open);
          }}
        >
          <MidiIcon />
          <span className="tool-word">MIDI</span>
          {learning ? (
            <span className="midi-learning">Learning</span>
          ) : (
            devices.length > 0 && <span className="midi-count">{devices.length}</span>
          )}
        </button>
      </Tooltip>
      {open && (
        <div className="midi-panel" role="dialog" aria-label="MIDI">
          <p className="midi-connection">{statusText(state)}</p>
          <div className="midi-activity">
            <span className="midi-heading">Last message</span>
            <span role="status" aria-label="MIDI activity">
              {activity ?? 'Nothing received yet'}
            </span>
          </div>
          {learning ? (
            <button
              type="button"
              className="tool tool-primary"
              onClick={() => {
                setOpen(false);
                onDone();
              }}
            >
              Done
            </button>
          ) : (
            <>
              <Tooltip content={TIPS.midiLearn}>
                <button
                  type="button"
                  className="tool"
                  disabled={!available}
                  onClick={() => {
                    setOpen(false);
                    onLearn();
                  }}
                >
                  MIDI Learn
                </button>
              </Tooltip>
              <Tooltip content={TIPS.quickSetup}>
                <button
                  type="button"
                  className="tool"
                  disabled={!available}
                  onClick={() => {
                    setOpen(false);
                    onQuickSetup();
                  }}
                >
                  Quick Setup
                </button>
              </Tooltip>
              {devices.some(isC16) && (
                <Tooltip content={TIPS.c16Layout}>
                  <button
                    type="button"
                    className="tool"
                    onClick={() => {
                      setOpen(false);
                      onC16Layout();
                    }}
                  >
                    C16 layout
                  </button>
                </Tooltip>
              )}
            </>
          )}
          {mappings.length > 0 && (
            <>
              <span className="midi-heading">Mappings</span>
              <ul className="midi-mappings" aria-label="Mappings">
                {mappings.map((m) => (
                  <li key={controlKey(m.control)}>
                    <span className="mapping-target">{describeTarget(m.target)}</span>
                    <span className="mapping-control">
                      {describeControl(m.control)} · {describeMode(m.mode)}
                    </span>
                    <button
                      type="button"
                      className="tool tool-icon"
                      aria-label={`Remove ${describeTarget(m.target)} Mapping`}
                      onClick={() => onRemove(m.control)}
                    >
                      <CloseIcon />
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="tool midi-clear" onClick={onClear}>
                Remove all
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
