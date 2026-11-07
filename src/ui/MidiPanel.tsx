import { Fragment, useState, useSyncExternalStore } from 'react';
import { BEND_RANGES, type BendRange } from '../app/rememberedSettings';
import { answeredBy, doubledPorts, knownAmong } from '../midi/controller';
import { describeControl, describeMode, describeTarget } from '../midi/describe';
import { type Control, type ControllerId, controlKey, type KnobMode, knobModeOf, type Mapping } from '../midi/mappings';
import { DESTINATIONS_BY_STAGE } from '../modulation/destinations';
import type { LfoDestination } from '../patch/patch';
import { useHeaderPanel } from './hooks/useHeaderPanel';
import type { MidiActivity } from './hooks/useMidi';
import { useUnderHeader } from './hooks/useUnderHeader';
import { CloseIcon, MidiIcon } from './icons';
import { Forms, useOneLine } from './oneLine';
import { Segmented } from './Segmented';
import { Tooltip } from './Tooltip';
import { CONTROLLER_TIPS, TIPS } from './tips';

export type MidiState =
  { kind: 'unsupported'; ios: boolean } | { kind: 'denied' } | { kind: 'pending' } | { kind: 'ready'; devices: string[] };

interface Props {
  state: MidiState;
  /** The panel opens: the moment to ask the browser for MIDI. */
  onOpen(): void;
  /** The Activity Monitor: the last message received, described, read by its line alone (issue 217). */
  activity: MidiActivity;
  mappings: readonly Mapping[];
  /** MIDI Learn (or Quick Setup) is on: the button says so, and the panel offers Done where Learn was started. */
  learning: boolean;
  onLearn(): void;
  onDone(): void;
  onQuickSetup(): void;
  /** Puts back a known Controller's layout (the C16's, offered while one is connected). */
  onLayout(id: ControllerId): void;
  onRemove(control: Control): void;
  /** A knob's Mapping switched by hand between Absolute and Relative, where Learn guessed wrong (issue 186). */
  onMode(control: Control, mode: KnobMode): void;
  onClear(): void;
  /** How far a keyboard's bend wheel takes the pitch, in semitones each way (issue 52). */
  bendRange: BendRange;
  onBendRange(semitones: BendRange): void;
  /** The Destination a keyboard's aftertouch moves, one of the LFOs' (issue 132). */
  aftertouch: LfoDestination;
  onAftertouch(destination: LfoDestination): void;
}

/** " · C16 only" for a Mapping of a known Controller's layout, which answers it alone; nothing for any other. */
const onlyFor = (mapping: Mapping) => {
  const known = answeredBy(mapping);
  return known ? ` · ${known.label} only` : null;
};

/** A known Controller connected on two ports at once (issue 185): which one Limpide follows, and why. */
const doubledPortsText = (devices: readonly string[]) =>
  doubledPorts(devices)
    .map(({ known, followed }) => ` The ${known.label} is connected twice (by USB and Bluetooth, say): Limpide follows ${followed} alone, so each press counts once.`)
    .join('');

const statusText = (state: MidiState) => {
  const devices = state.kind === 'ready' ? state.devices : [];
  return state.kind === 'unsupported' && state.ios
    ? 'No browser on iPhone or iPad supports Web MIDI, Chrome included: Apple makes them all run on Safari’s engine. Play from a MIDI Controller on a computer or an Android device; everything else works here.'
    : state.kind === 'unsupported'
      ? 'This browser does not support Web MIDI (Safari does not). Use Chrome or Edge to play from a MIDI Controller; everything else works here.'
      : state.kind === 'denied'
        ? 'MIDI access was not allowed, so Controllers cannot be heard. Allow MIDI in the browser’s site settings, or open Limpide in Chrome or Edge (some built-in browsers never allow it).'
        : devices.length
          ? `Connected: ${devices.join(', ')}. Its keys and pads play the synth, with Velocity.${doubledPortsText(devices)}`
          : // A Bluetooth Controller is a port like any other once the system has paired it, as the owner's C16 is (issue 143).
            'No MIDI Controller connected. Plug one in by USB and it is picked up straight away. A Bluetooth one plays once the system pairs it as a MIDI device (on a Mac, in Audio MIDI Setup; on Windows and Linux, untried), as a TempoPAD C16 does on a Mac.';
};

/** The last message received: each message redraws this line alone, not the panel nor the page (issue 217). */
function ActivityLine({ activity }: { activity: MidiActivity }) {
  const line = useSyncExternalStore(activity.subscribe, activity.get);
  return (
    <span role="status" aria-label="MIDI activity">
      {line ?? 'Nothing received yet'}
    </span>
  );
}

/**
 * The MIDI button: a dot and the number of Controllers, and "Learning" in its word's place while MIDI Learn is on. It opens the MIDI
 * panel: what is connected, the Activity Monitor, MIDI Learn (and Done, once learning), and the Mappings. Escape from
 * anywhere in it, MIDI Learn, Done and a layout close it back to the button; Quick Setup, to its card (issue 189).
 */
export function MidiPanel({
  state, onOpen, activity, mappings, learning, onLearn, onDone, onQuickSetup, onLayout, onRemove, onMode, onClear, bendRange, onBendRange,
  aftertouch, onAftertouch,
}: Props) {
  const [open, setOpen] = useState(false);
  const { wrapper, button } = useHeaderPanel(open, setOpen);
  /** The panel closes as a button in it acts, and the focus goes back to the MIDI button, not to the page (issue 189). */
  const closeToButton = () => {
    button.current?.focus();
    setOpen(false);
  };
  const panel = useUnderHeader<HTMLDivElement>();
  const devices = state.kind === 'ready' ? state.devices : [];
  const available = state.kind === 'ready' || state.kind === 'pending';
  // Why MIDI Learn and Quick Setup, disabled, do nothing (issue 252); the panel's first line says it at length.
  const why = state.kind === 'unsupported' ? 'This browser gives no MIDI' : state.kind === 'denied' ? 'MIDI is blocked for this site' : undefined;
  const learningWord = useOneLine<HTMLSpanElement>(learning ? 'learning' : '');

  return (
    <div className="midi-menu" ref={wrapper}>
      <Tooltip content={{ ...TIPS.midi, body: statusText(state) }}>
        <button
          ref={button}
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
          {/* While learning, the word says so in the room of the MIDI word and the count, in a shorter form where that
              is short, and they keep their places unseen: the button never widens (issue 188). */}
          <span className="midi-words">
            <span className="tool-word">MIDI</span>
            {devices.length > 0 && <span className="midi-count">{devices.length}</span>}
            {learning && (
              <span className="tool-word midi-learning" ref={learningWord}>
                <Forms name="Learning" />
              </span>
            )}
          </span>
        </button>
      </Tooltip>
      {open && (
        <div ref={panel} className="midi-panel" data-panel role="dialog" aria-label="MIDI">
          <p className="midi-connection">{statusText(state)}</p>
          <div className="midi-activity">
            <span className="midi-heading">Last message</span>
            <ActivityLine activity={activity} />
          </div>
          {learning ? (
            <button
              type="button"
              className="tool tool-primary"
              onClick={() => {
                closeToButton();
                onDone();
              }}
            >
              Done
            </button>
          ) : (
            <>
              <Tooltip content={{ ...TIPS.midiLearn, why }}>
                <button
                  type="button"
                  className="tool"
                  disabled={!available}
                  onClick={() => {
                    closeToButton();
                    onLearn();
                  }}
                >
                  MIDI Learn
                </button>
              </Tooltip>
              {/* Quick Setup's card takes the focus, as a Tutorial picked from its list does. */}
              <Tooltip content={{ ...TIPS.quickSetup, why }}>
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
              {/* Each known Controller connected offers its layout and its card to print, which opens at #<id>-card. */}
              {knownAmong(devices).map(({ id, label }) => (
                <Fragment key={id}>
                  <Tooltip content={CONTROLLER_TIPS[id].layout}>
                    <button
                      type="button"
                      className="tool"
                      onClick={() => {
                        closeToButton();
                        onLayout(id);
                      }}
                    >
                      {label} layout
                    </button>
                  </Tooltip>
                  <Tooltip content={CONTROLLER_TIPS[id].card}>
                    <a className="tool" href={`#${id}-card`} target="_blank" rel="noopener">
                      Print {label} card
                    </a>
                  </Tooltip>
                </Fragment>
              ))}
            </>
          )}
          {available && (
            <Tooltip content={TIPS.bendRange}>
              <Segmented
                label="Pitch bend range"
                caption="Bend"
                value={bendRange}
                options={BEND_RANGES.map((n) => ({ value: n, label: `${n}`, name: `${n} semitones` }))}
                onChange={onBendRange}
              />
            </Tooltip>
          )}
          {available && (
            <Tooltip content={TIPS.aftertouch}>
              {/* Grouped by stage, as the LFOs' Destination menu is. */}
              <label className="segmented-field midi-aftertouch">
                <span className="field-caption">Aftertouch</span>
                <select className="tool" value={aftertouch} onChange={(e) => onAftertouch(e.target.value as LfoDestination)}>
                  {DESTINATIONS_BY_STAGE.map(({ stage, destinations }) => (
                    <optgroup key={stage.id} label={stage.name}>
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            </Tooltip>
          )}
          {mappings.length > 0 && (
            <>
              <span className="midi-heading">Mappings</span>
              <ul className="midi-mappings" aria-label="Mappings">
                {mappings.map((m) => {
                  const mode = knobModeOf(m.mode);
                  return (
                    <li key={controlKey(m.control)}>
                      <span className="mapping-target">{describeTarget(m.target)}</span>
                      <span className="mapping-control">
                        {describeControl(m.control)}
                        {mode ? null : ` · ${describeMode(m.mode)}`}
                        {onlyFor(m)}
                      </span>
                      {mode && (
                        <Segmented
                          label={`${describeTarget(m.target)} mode`}
                          value={mode}
                          options={[
                            { value: 'absolute', label: 'Absolute', name: describeMode('absolute') },
                            { value: 'relative', label: 'Relative' },
                          ]}
                          onChange={(next) => onMode(m.control, next)}
                        />
                      )}
                      <button
                        type="button"
                        className="tool tool-icon"
                        aria-label={`Remove ${describeTarget(m.target)} Mapping`}
                        onClick={() => onRemove(m.control)}
                      >
                        <CloseIcon />
                      </button>
                    </li>
                  );
                })}
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
