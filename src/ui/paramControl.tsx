import { useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { type GeekReadout, geekReadout, geekReadoutParts, readoutText, widestGeekReadout } from '../music/geek';
import { type StepSize, stepParamBy } from '../patch/grid';
import { formatParam, inUnitShown, PARAMS, type ParamId, paramName } from '../patch/patch';
import { positionToValue, valueToPosition } from '../patch/taper';
import { GeekContext, GeekNoteContext, GeekOnContext, GeekTempoContext } from './geekContext';
import { addDescription, removeDescription } from './inactive';
import { useLearnable } from './learn';

/** Readouts sampled across a control's travel to find the widest it can show. */
const WIDTH_SAMPLES = 128;
/** How long a control keeps showing its value after it last changed (where values only show while changing). */
const SHOW_VALUE_MS = 1200;

/** The longest readouts a Parameter can show, so its control can reserve their width and never change size. */
function longestReadouts(id: ParamId): string[] {
  const def = PARAMS[id];
  const values = [def.default, ...Array.from({ length: WIDTH_SAMPLES + 1 }, (_, i) => positionToValue(def, i / WIDTH_SAMPLES))];
  const all = new Set(values.map((v) => formatParam(id, v)));
  return [...all].sort((a, b) => b.length - a.length).slice(0, 4);
}

/** The Parameters one control turns: itself and those turned by its knob, as an LFO's Rate turns its note value. */
const turnedTogether = (id: ParamId): ParamId[] => {
  const knob = PARAMS[id].knob ?? id;
  return (Object.keys(PARAMS) as ParamId[]).filter((other) => (PARAMS[other].knob ?? other) === knob);
};

/**
 * The longest readouts a control can show, whichever of its Parameters it turns, so it keeps one width as it turns
 * and as it changes Parameter: a Rate keeps its width through every Hz and note value, Sync on or off (issue 176).
 */
const widestReadouts = (id: ParamId): string[] => [...new Set(turnedTogether(id).flatMap(longestReadouts))];

/**
 * What every Parameter control shares, knob or fader: its position, the arrow keys (steps on its Grid, Shift fine and
 * Page coarse: issue 160), double-click to reset, MIDI Learn (as the Parameter whose knob it is, `def.knob`), the
 * moment it changes, and the value bubble above a finger that drags it.
 */
export function useParamControl(id: ParamId, value: number, onChange: (value: number) => void, spoken?: string) {
  const def = PARAMS[id];
  const position = valueToPosition(def, value);
  const setPosition = (p: number) => onChange(positionToValue(def, Math.min(1, Math.max(0, p))));
  // The value the last step set, until a render shows it: steps quicker than renders (a held key, a fast wheel) each
  // go on from the one before.
  const stepped = useRef(value);
  stepped.current = value;
  // The Grid of the unit it reads: a Mixer fader's % outside the Synth Geek Layer, its dB inside it (issue 201).
  const stepping = inUnitShown(def, useContext(GeekOnContext));
  /** Moves `steps` steps of `size` along the Parameter's Grid (issue 160), signed. */
  const nudge = (steps: number, size: StepSize) => {
    stepped.current = stepParamBy(stepping, stepped.current, steps, size);
    onChange(stepped.current);
  };
  const learnable = useLearnable({ kind: 'param', id: def.knob ?? id });
  // In the Synth Geek Layer some controls read the quantity behind their value instead (Q, dB): sized for it while on.
  // Some depend on the Note played (Detune's beats): followed as the Note changes, a control rendering again only when
  // its own readout's text does. A synced Rate's period depends on the tempo.
  const geekPatch = useContext(GeekContext);
  const notes = useContext(GeekNoteContext);
  const bpm = useContext(GeekTempoContext);
  useSyncExternalStore(notes.subscribe, () => (geekPatch ? geekReadout(id, value, geekPatch, { note: notes.get(), bpm }) : undefined));
  const geek = geekPatch ? geekReadoutParts(id, value, geekPatch, { note: notes.get(), bpm }) : undefined;
  const readout = geek ? readoutText(geek) : formatParam(id, value);
  const geekOn = !!geekPatch; // the context holds null while the layer is off
  const widest = useMemo<GeekReadout[]>(
    () => [...widestReadouts(id).map((figure) => ({ figure })), ...(geekOn ? turnedTogether(id).flatMap(widestGeekReadout) : [])],
    [id, geekOn],
  );
  const fit = useValueFit(widest);
  const changing = useChanging(value);
  const [touching, setTouching] = useState(false);
  // The Synth Geek Layer's readout ("Q 1.32") is part of the slider's description, so a screen reader hears it on the
  // knob, not as loose text beside it (issue 189); near the start, before its tooltip.
  const geekId = useId();
  const describe = useCallback(
    (readout: HTMLElement | null) => {
      const control = readout?.closest('.knob')?.querySelector('[role="slider"]');
      if (!control) return;
      addDescription(control, geekId, 'first');
      return () => removeDescription(control, geekId);
    },
    [geekId],
  );

  const slider = {
    role: 'slider',
    tabIndex: 0,
    'aria-label': paramName(id),
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': Math.round(position * 100),
    'aria-valuetext': spoken ? `${formatParam(id, value)}, ${spoken}` : formatParam(id, value),
    onDoubleClick: () => onChange(def.default),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement | SVGElement>) => {
      delete (e.currentTarget as HTMLElement).dataset.pointer; // keyboard focus from now on: show the ring
      // A step on the Grid, Shift a fine one; Page Up and Down a coarse one, Home and End to the ends (the WAI-ARIA
      // slider pattern, issue 51). A held key repeats at the system's rate, the same step each time (issue 160).
      const size = e.shiftKey ? 'fine' : 'unit';
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') nudge(1, size);
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') nudge(-1, size);
      else if (e.key === 'PageUp') nudge(1, 'coarse');
      else if (e.key === 'PageDown') nudge(-1, 'coarse');
      else if (e.key === 'Home') onChange(def.min);
      else if (e.key === 'End') onChange(def.max);
      else return;
      e.preventDefault();
      e.stopPropagation();
    },
  } as const;

  /** Takes the focus for the keys, marked as the pointer's, so no keyboard-focus ring shows for a click or a drag. */
  const focusByPointer = (target: HTMLElement | SVGElement) => {
    target.dataset.pointer = '';
    target.addEventListener('blur', () => delete target.dataset.pointer, { once: true });
    target.focus();
  };
  /** A press on the control's dial or cap: keeps the drag (and Safari's text selection) to itself. */
  const grab = (e: React.PointerEvent, target: HTMLElement | SVGElement) => {
    e.preventDefault();
    focusByPointer(target);
    target.setPointerCapture(e.pointerId);
    if (e.pointerType === 'touch') setTouching(true);
  };
  const release = () => setTouching(false);

  const attributes = {
    'data-changing': changing || undefined,
    'data-bubble': touching || undefined,
    ...learnable,
  };
  const text = (
    <>
      {touching && <div className="value-bubble">{readout}</div>}
      <div className="knob-label">{def.label}</div>
      <div className="knob-value" ref={fit}>
        {geek ? (
          <span data-geek id={geekId} ref={describe}>
            {geek.figure}
            {geek.words && <span className="geek-words"> {geek.words}</span>}
          </span>
        ) : (
          <span>{readout}</span>
        )}
        {widest.map((t) => (
          <span key={readoutText(t)} className="knob-value-sizer" aria-hidden="true">
            {t.figure}
            {t.words && <span className="geek-words"> {t.words}</span>}
          </span>
        ))}
      </div>
    </>
  );
  return { def, position, setPosition, nudge, slider, grab, focusByPointer, release, attributes, text };
}

/**
 * Where a control's value shows in its name's place (up to 860 px), how much smaller it is drawn so the widest it can
 * show there fits the control's own column (issue 207): its readout's size times `--value-fit`, at most 1, set on the
 * readout's box. The box is the column's width there, and its copies of the widest lie out of the flow, measured at the
 * readout's own size; both are watched, as the window and the fonts change. Elsewhere the copies size the box, and the
 * fit is 1.
 */
function useValueFit(widest: readonly GeekReadout[]) {
  const [box, setBox] = useState<HTMLElement | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: new widest readouts (the layer switched) are new copies to watch
  useLayoutEffect(() => {
    if (!box) return;
    const sizers = [...box.querySelectorAll<HTMLElement>('.knob-value-sizer')];
    const measure = () => {
      const room = box.getBoundingClientRect().width;
      const need = Math.max(0, ...sizers.map((s) => s.getBoundingClientRect().width));
      const fit = need > room && room > 0 ? Math.floor((room / need) * 1000) / 1000 : 1;
      box.style.setProperty('--value-fit', String(fit));
    };
    measure();
    const watch = new ResizeObserver(measure);
    for (const el of [box, ...sizers]) watch.observe(el);
    return () => watch.disconnect();
  }, [box, widest]);
  return setBox;
}

/**
 * A press that may turn a control: the main button only, so a right- or Ctrl-click (whose context menu takes the
 * release) never starts a drag that outlives it (the owner's bug).
 */
export const pressed = (e: React.PointerEvent) => e.button === 0 && !(e.pointerType === 'mouse' && e.ctrlKey);

/** Whether the press is still on: a move with no button held means its release never reached the page. */
const held = (e: React.PointerEvent) => (e.buttons & 1) === 1;

/**
 * A press on a knob or a fader: what it started with, kept until it ends however it ends (let go, cancelled, its
 * capture lost, or a move with no button held, its release never heard), each end releasing the control.
 */
export function usePress<T>(control: { release(): void }) {
  const press = useRef<T | null>(null);
  /** Ends the press and gives what it started with, or null if none was on. */
  const end = () => {
    const p = press.current;
    press.current = null;
    control.release();
    return p;
  };
  return {
    start: (p: T) => {
      press.current = p;
    },
    /** The press a move carries on, or null: none is on, or its button was let go where the page never heard it. */
    move(e: React.PointerEvent): T | null {
      if (press.current && !held(e)) end();
      return press.current;
    },
    end,
    /** The handlers for the ends that need nothing more. */
    ends: { onPointerCancel: end, onLostPointerCapture: end },
  };
}

/** True for a moment after `value` changes, however it was changed (hand, keys, MIDI, the Demo, a Patch). */
function useChanging(value: number): boolean {
  const [changing, setChanging] = useState(false);
  const shown = useRef(value);
  useEffect(() => {
    if (value === shown.current) return; // not on mount (which StrictMode repeats)
    shown.current = value;
    setChanging(true);
    const timer = setTimeout(() => setChanging(false), SHOW_VALUE_MS);
    return () => clearTimeout(timer);
  }, [value]);
  return changing;
}

/** The scroll that moves a control one step: about a notch (Firefox's is 99 px), however many events make it. */
const STEP_PIXELS = 90;
/** Scroll gathered towards a step is forgotten after this long without any. */
const STEP_FORGET_MS = 1000;

/**
 * The mouse wheel or a two-finger scroll over a control turns it (issue 53), Shift for fine, and the page does not
 * scroll meanwhile. React's wheel listeners cannot stop the scroll (they are passive), so this is the element's own.
 * A notch's worth of scroll in one direction moves a step of the control's Grid, small trackpad scrolls adding up to
 * it, so a notch always moves an Octave one step (issue 105) and a Cutoff a semitone (issue 160).
 */
export function useWheel(control: { nudge(steps: number, size: StepSize): void }) {
  // The listener is added by a ref callback, not an effect, so it reads the control kept here with each render.
  const latest = useRef(control.nudge);
  latest.current = control.nudge;
  const listening = useRef<{ element: Element; listener: (e: WheelEvent) => void } | null>(null);
  const gathered = useRef({ pixels: 0, at: 0 });
  // A ref callback, so it follows the element however it is mounted.
  return useCallback((element: Element | null) => {
    if (listening.current) listening.current.element.removeEventListener('wheel', listening.current.listener as EventListener);
    listening.current = null;
    if (!element) return;
    const listener = (e: WheelEvent) => {
      const pixels = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 33 : e.deltaY;
      if (!pixels) return;
      e.preventDefault();
      const g = gathered.current;
      if (Math.sign(g.pixels) !== Math.sign(pixels) || e.timeStamp - g.at > STEP_FORGET_MS) g.pixels = 0;
      g.pixels += pixels;
      g.at = e.timeStamp;
      const steps = Math.trunc(g.pixels / STEP_PIXELS);
      if (!steps) return;
      g.pixels = 0; // what is left over would make some notches move two steps
      latest.current(-steps, e.shiftKey ? 'fine' : 'unit');
    };
    element.addEventListener('wheel', listener as EventListener, { passive: false });
    listening.current = { element, listener };
  }, []);
}
